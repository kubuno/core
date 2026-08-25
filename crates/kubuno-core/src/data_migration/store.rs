//! Reading and writing the campaign ledger.
//!
//! Two disciplines run through every query here.
//!
//! **The credential is never selected by accident.** No read enumerates `*`;
//! `secret_enc` appears in exactly two statements — the insert that writes it
//! and [`secret_of`], which the background job calls and no handler does. The
//! struct the console gets back has no field able to hold it.
//!
//! **Progress is written after the work, never before.** A chunk is recorded
//! once the module has answered, so a crash mid-chunk loses the chunk and not
//! the count. Re-running the same cursor is safe by contract (see the module
//! header), which is what makes "record late" the correct side to err on.

use crate::crypto::datakey;
use std::collections::HashMap;

use chrono::NaiveDate;
use sqlx::{PgConnection, PgPool, Row};
use uuid::Uuid;

use super::model::{
    AccountMappingInput, Campaign, CampaignTally, MigrationAccount, ServiceKind, SourceSpec,
};
use crate::crypto::encryption;
use crate::errors::AppError;

/// Columns of a campaign, everywhere. Listed rather than `*` so adding a column
/// to the table can never silently widen an API response.
const CAMPAIGN_COLUMNS: &str = "id, name, service, module_id, source_kind, source_host, \
     source_port, source_security, since_date, exclude_folders, status, created_by, \
     actor_label, created_at, started_at, finished_at, error";

/// The key the source credentials are sealed with.
///
/// Derived from the instance's JWT secret with its own domain separator, like
/// every other secret at rest in the core (`mailer::config`, `directory::config`):
/// one compromised subsystem must not hand an attacker the others' plaintext.
fn secret_key(jwt_secret: &str) -> [u8; 32] {
    // The key comes from the data-encryption root, not from the token-signing
    // secret, so rotating the latter leaves what is stored readable. The root is
    // seeded with the JWT secret on first boot, so existing values keep the same
    // derivation; `jwt_secret` is only the fallback when the root was never loaded.
    datakey::key(b"kubuno:data-migration:", jwt_secret)
}

pub fn seal(jwt_secret: &str, plain: &str) -> Result<String, AppError> {
    encryption::encrypt(&secret_key(jwt_secret), plain.as_bytes()).map_err(AppError::Internal)
}

pub fn unseal(jwt_secret: &str, sealed: &str) -> Result<String, AppError> {
    let bytes = encryption::decrypt(&secret_key(jwt_secret), sealed).map_err(AppError::Internal)?;
    String::from_utf8(bytes)
        .map_err(|_| AppError::Internal(anyhow::anyhow!("Identifiant source illisible")))
}

// ── Reads ───────────────────────────────────────────────────────────────────

pub async fn list(db: &PgPool) -> Result<Vec<Campaign>, AppError> {
    sqlx::query_as::<_, Campaign>(&format!(
        "SELECT {CAMPAIGN_COLUMNS} FROM core.migration_campaigns ORDER BY created_at DESC"
    ))
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "data_migration: liste des campagnes");
        AppError::Database(e)
    })
}

pub async fn get(db: &PgPool, id: Uuid) -> Result<Campaign, AppError> {
    sqlx::query_as::<_, Campaign>(&format!(
        "SELECT {CAMPAIGN_COLUMNS} FROM core.migration_campaigns WHERE id = $1"
    ))
    .bind(id)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, campagne = %id, "data_migration: lecture d'une campagne");
        AppError::Database(e)
    })?
    .ok_or_else(|| AppError::NotFound("Campagne de migration introuvable".into()))
}

/// One tally per campaign, in a single pass — a per-row count would be N+1
/// queries on a page whose whole point is to be glanced at.
pub async fn tallies(db: &PgPool) -> Result<HashMap<Uuid, CampaignTally>, AppError> {
    let rows = sqlx::query(
        "SELECT campaign_id, \
                COUNT(*)::bigint                                             AS accounts, \
                COUNT(*) FILTER (WHERE status = 'pending')::bigint           AS pending, \
                COUNT(*) FILTER (WHERE status = 'running')::bigint           AS running, \
                COUNT(*) FILTER (WHERE status = 'done')::bigint              AS done, \
                COUNT(*) FILTER (WHERE status = 'failed')::bigint            AS failed, \
                COALESCE(SUM(items_copied), 0)::bigint                       AS copied, \
                COALESCE(SUM(items_total), 0)::bigint                        AS total \
           FROM core.migration_accounts GROUP BY campaign_id",
    )
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "data_migration: décompte des campagnes");
        AppError::Database(e)
    })?;

    let mut out = HashMap::new();
    for row in &rows {
        let id: Uuid = row.try_get("campaign_id").map_err(AppError::Database)?;
        out.insert(
            id,
            CampaignTally {
                accounts: row.try_get("accounts").map_err(AppError::Database)?,
                pending:  row.try_get("pending").map_err(AppError::Database)?,
                running:  row.try_get("running").map_err(AppError::Database)?,
                done:     row.try_get("done").map_err(AppError::Database)?,
                failed:   row.try_get("failed").map_err(AppError::Database)?,
                copied:   row.try_get("copied").map_err(AppError::Database)?,
                total:    row.try_get("total").map_err(AppError::Database)?,
            },
        );
    }
    Ok(out)
}

/// The mapped accounts of one campaign, with the destination resolved.
pub async fn accounts(db: &PgPool, campaign_id: Uuid) -> Result<Vec<MigrationAccount>, AppError> {
    sqlx::query_as::<_, MigrationAccount>(
        "SELECT a.id, a.campaign_id, a.source_login, a.target_user_id, \
                u.email::text AS target_email, u.display_name AS target_name, \
                a.status, a.items_copied, a.items_total, a.attempts, a.error, \
                a.started_at, a.finished_at, a.updated_at \
           FROM core.migration_accounts a \
           LEFT JOIN core.users u ON u.id = a.target_user_id \
          WHERE a.campaign_id = $1 \
          ORDER BY a.source_login",
    )
    .bind(campaign_id)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, campagne = %campaign_id, "data_migration: comptes d'une campagne");
        AppError::Database(e)
    })
}

/// The services this instance can actually migrate right now: those the core
/// knows how to orchestrate AND whose module is currently registered.
///
/// Answered from the registry rather than from a list in the code, so an
/// instance that has not installed the mail module is never offered a mail
/// migration — and so adding a module later needs no change here.
pub async fn available_services(db: &PgPool) -> Result<Vec<(ServiceKind, bool)>, AppError> {
    let rows = sqlx::query(
        "SELECT module_id FROM core.module_instances \
          WHERE status IN ('healthy', 'starting')",
    )
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "data_migration: modules disponibles");
        AppError::Database(e)
    })?;

    let mut installed: Vec<String> = Vec::with_capacity(rows.len());
    for row in &rows {
        installed.push(row.try_get::<String, _>("module_id").map_err(AppError::Database)?);
    }

    Ok(ServiceKind::ALL
        .iter()
        .map(|service| {
            let ready = installed.iter().any(|m| m == service.module_id());
            (*service, ready)
        })
        .collect())
}

/// Where a module answers, if it is up.
pub async fn module_base_url(db: &PgPool, module_id: &str) -> Result<Option<String>, AppError> {
    sqlx::query_scalar::<_, String>(
        "SELECT base_url FROM core.module_instances \
          WHERE module_id = $1 AND status IN ('healthy', 'starting') \
          ORDER BY last_heartbeat DESC NULLS LAST LIMIT 1",
    )
    .bind(module_id)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, module = %module_id, "data_migration: adresse du module");
        AppError::Database(e)
    })
}

/// The sealed credential of one mapped account. Called by the background job
/// and by nothing else.
pub async fn secret_of(db: &PgPool, account_id: Uuid) -> Result<String, AppError> {
    sqlx::query_scalar::<_, String>("SELECT secret_enc FROM core.migration_accounts WHERE id = $1")
        .bind(account_id)
        .fetch_optional(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, compte = %account_id, "data_migration: lecture d'identifiant");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Compte de migration introuvable".into()))
}

// ── Writes ──────────────────────────────────────────────────────────────────

#[allow(clippy::too_many_arguments)] // a campaign is a source plus a data range
pub async fn create_campaign(
    tx: &mut PgConnection,
    name: &str,
    service: ServiceKind,
    source: &SourceSpec,
    since: Option<NaiveDate>,
    exclude: &[String],
    actor: Uuid,
    actor_label: &str,
) -> Result<Uuid, AppError> {
    sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO core.migration_campaigns \
             (name, service, module_id, source_kind, source_host, source_port, \
              source_security, since_date, exclude_folders, created_by, actor_label) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
    )
    .bind(name)
    .bind(service.as_str())
    .bind(service.module_id())
    .bind(&source.kind)
    .bind(&source.host)
    .bind(source.port)
    .bind(&source.security)
    .bind(since)
    .bind(exclude)
    .bind(actor)
    .bind(actor_label)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "data_migration: création de campagne");
        AppError::Database(e)
    })
}

/// Writes the mappings. The credential is sealed here and nowhere else.
pub async fn add_accounts(
    tx: &mut PgConnection,
    campaign_id: Uuid,
    mappings: &[AccountMappingInput],
    jwt_secret: &str,
) -> Result<(), AppError> {
    for mapping in mappings {
        let sealed = seal(jwt_secret, &mapping.password)?;
        sqlx::query(
            "INSERT INTO core.migration_accounts \
                 (campaign_id, source_login, secret_enc, target_user_id) \
             VALUES ($1, $2, $3, $4)",
        )
        .bind(campaign_id)
        .bind(mapping.source_login.trim())
        .bind(&sealed)
        .bind(mapping.target_user_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| match e {
            // The unique index on (campaign, login) speaking: two rows for the
            // same source account would migrate it twice.
            sqlx::Error::Database(ref db_err) if db_err.code().as_deref() == Some("23505") => {
                AppError::Conflict(format!(
                    "Le compte source « {} » figure deux fois dans cette campagne.",
                    mapping.source_login.trim()
                ))
            }
            // A destination that does not exist, or was deleted between the
            // form and the submission.
            sqlx::Error::Database(ref db_err) if db_err.code().as_deref() == Some("23503") => {
                AppError::Validation(
                    "Compte de destination inconnu : rechargez la page et refaites la correspondance."
                        .into(),
                )
            }
            other => {
                tracing::error!(error = %other, campagne = %campaign_id, "data_migration: ajout d'un compte");
                AppError::Database(other)
            }
        })?;
    }
    Ok(())
}

/// Moves a campaign to `status`, stamping the timestamp that goes with it.
pub async fn set_campaign_status(
    db: &PgPool,
    id: Uuid,
    status: &str,
    error: Option<&str>,
) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.migration_campaigns \
            SET status      = $2, \
                error       = $3, \
                started_at  = CASE WHEN $2 = 'running' THEN COALESCE(started_at, NOW()) ELSE started_at END, \
                finished_at = CASE WHEN $2 IN ('done', 'failed') THEN NOW() \
                                   WHEN $2 = 'running'           THEN NULL \
                                   ELSE finished_at END \
          WHERE id = $1",
    )
    .bind(id)
    .bind(status)
    .bind(error)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, campagne = %id, "data_migration: changement d'état");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Puts one failed account back in the queue, keeping its cursor: a retry
/// resumes where the failure happened rather than copying everything again.
pub async fn retry_account(db: &PgPool, campaign_id: Uuid, account_id: Uuid) -> Result<(), AppError> {
    let affected = sqlx::query(
        "UPDATE core.migration_accounts \
            SET status = 'pending', error = NULL, finished_at = NULL, updated_at = NOW() \
          WHERE id = $1 AND campaign_id = $2 AND status = 'failed'",
    )
    .bind(account_id)
    .bind(campaign_id)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, compte = %account_id, "data_migration: relance d'un compte");
        AppError::Database(e)
    })?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::Conflict(
            "Ce compte n'est pas en échec : il n'y a rien à relancer.".into(),
        ));
    }
    Ok(())
}

pub async fn delete_campaign(tx: &mut PgConnection, id: Uuid) -> Result<(), AppError> {
    // The accounts go with it (ON DELETE CASCADE), and with them the sealed
    // credentials — a finished campaign must not keep an organisation's
    // passwords alive for ever.
    sqlx::query("DELETE FROM core.migration_campaigns WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, campagne = %id, "data_migration: suppression");
            AppError::Database(e)
        })?;
    Ok(())
}

// ── The job's side of the ledger ────────────────────────────────────────────

/// One account to work on: everything the job needs to call the module.
pub struct ClaimedAccount {
    pub account_id:     Uuid,
    pub campaign:       Campaign,
    pub source_login:   String,
    pub target_user_id: Uuid,
    pub cursor:         Option<serde_json::Value>,
}

/// Rows a killed process left `running` go back in the queue.
///
/// The stall window is generous on purpose: a chunk is bounded by the module's
/// own budget, so a row untouched for ten minutes is a dead worker rather than
/// a slow one, and reclaiming a live row would only duplicate work the module
/// would then discard.
pub async fn reclaim_stalled(db: &PgPool) -> Result<u64, AppError> {
    let affected = sqlx::query(
        "UPDATE core.migration_accounts \
            SET status = 'pending', updated_at = NOW() \
          WHERE status = 'running' AND updated_at < NOW() - INTERVAL '10 minutes'",
    )
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "data_migration: reprise des comptes interrompus");
        AppError::Database(e)
    })?
    .rows_affected();
    Ok(affected)
}

/// The next account to advance, across every running campaign.
///
/// Ordered by `updated_at` so a worker shares itself fairly between the
/// accounts of a campaign rather than finishing the first mailbox before
/// touching the second — an operator watching two hundred rows needs to see all
/// of them move, and a source server throttles a single login long before it
/// throttles the connection.
pub async fn claim_next(db: &PgPool) -> Result<Option<ClaimedAccount>, AppError> {
    let row = sqlx::query(
        "UPDATE core.migration_accounts a \
            SET status     = 'running', \
                attempts   = a.attempts + 1, \
                started_at = COALESCE(a.started_at, NOW()), \
                updated_at = NOW() \
          WHERE a.id = ( \
                SELECT inner_a.id \
                  FROM core.migration_accounts inner_a \
                  JOIN core.migration_campaigns c ON c.id = inner_a.campaign_id \
                 WHERE c.status = 'running' \
                   AND inner_a.status IN ('pending', 'running') \
                 ORDER BY inner_a.updated_at ASC \
                 LIMIT 1 FOR UPDATE OF inner_a SKIP LOCKED) \
          RETURNING a.id, a.campaign_id, a.source_login, a.target_user_id, a.cursor",
    )
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "data_migration: réservation d'un compte");
        AppError::Database(e)
    })?;

    let Some(row) = row else { return Ok(None) };

    let campaign_id: Uuid = row.try_get("campaign_id").map_err(AppError::Database)?;
    let campaign = get(db, campaign_id).await?;

    Ok(Some(ClaimedAccount {
        account_id:     row.try_get("id").map_err(AppError::Database)?,
        campaign,
        source_login:   row.try_get("source_login").map_err(AppError::Database)?,
        target_user_id: row.try_get("target_user_id").map_err(AppError::Database)?,
        cursor:         row.try_get("cursor").map_err(AppError::Database)?,
    }))
}

/// Records what one chunk achieved.
///
/// `copied` is a DELTA — what this chunk moved — because the module is
/// stateless between calls and only the ledger knows the running total.
pub async fn record_chunk(
    db: &PgPool,
    account_id: Uuid,
    copied: i32,
    total: i32,
    cursor: &serde_json::Value,
    done: bool,
) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.migration_accounts \
            SET items_copied = items_copied + $2, \
                items_total  = GREATEST(items_total, $3), \
                cursor       = $4, \
                status       = CASE WHEN $5 THEN 'done' ELSE 'running' END, \
                finished_at  = CASE WHEN $5 THEN NOW() ELSE NULL END, \
                error        = NULL, \
                updated_at   = NOW() \
          WHERE id = $1",
    )
    .bind(account_id)
    .bind(copied.max(0))
    .bind(total.max(0))
    .bind(cursor)
    .bind(done)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, compte = %account_id, "data_migration: enregistrement d'un lot");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Puts a claimed account back without holding the attempt against it.
///
/// Used when the failure was not the account's: the module was down, its
/// address could not be read. `attempts` is walked back because it is the
/// number the console shows next to "relancé N fois", and an unreachable module
/// must not make a mailbox look like it keeps failing.
pub async fn release_account(db: &PgPool, account_id: Uuid) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.migration_accounts \
            SET status = 'pending', attempts = GREATEST(attempts - 1, 0), updated_at = NOW() \
          WHERE id = $1 AND status = 'running'",
    )
    .bind(account_id)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, compte = %account_id, "data_migration: libération d'un compte");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Marks one account failed, keeping its cursor so a retry resumes.
pub async fn fail_account(db: &PgPool, account_id: Uuid, message: &str) -> Result<(), AppError> {
    // Truncated: a server that answers with a wall of text must not turn one
    // row of a table into a page of it.
    let message: String = message.chars().take(500).collect();
    sqlx::query(
        "UPDATE core.migration_accounts \
            SET status = 'failed', error = $2, finished_at = NOW(), updated_at = NOW() \
          WHERE id = $1",
    )
    .bind(account_id)
    .bind(&message)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, compte = %account_id, "data_migration: échec d'un compte");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Closes every running campaign that has nothing left to do.
///
/// A campaign is *finished*, not *successful*: accounts that failed keep their
/// error and stay retryable, and the report is what says which. Calling it
/// "done" while a row is red would be the report lying about the campaign it
/// exists to describe, so the console reads the tally rather than the status
/// when it wants that distinction.
pub async fn close_finished(db: &PgPool) -> Result<Vec<Uuid>, AppError> {
    let rows = sqlx::query(
        "UPDATE core.migration_campaigns c \
            SET status = 'done', finished_at = NOW() \
          WHERE c.status = 'running' \
            AND NOT EXISTS ( \
                SELECT 1 FROM core.migration_accounts a \
                 WHERE a.campaign_id = c.id AND a.status IN ('pending', 'running')) \
          RETURNING c.id",
    )
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "data_migration: clôture des campagnes");
        AppError::Database(e)
    })?;

    let mut ids = Vec::with_capacity(rows.len());
    for row in &rows {
        ids.push(row.try_get::<Uuid, _>("id").map_err(AppError::Database)?);
    }
    Ok(ids)
}

/// Is there anything at all for the job to do? Decides whether the chain
/// re-arms — an idle instance must not poll for ever.
pub async fn has_work(db: &PgPool) -> Result<bool, AppError> {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS( \
            SELECT 1 FROM core.migration_accounts a \
              JOIN core.migration_campaigns c ON c.id = a.campaign_id \
             WHERE c.status = 'running' AND a.status IN ('pending', 'running'))",
    )
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "data_migration: recherche de travail restant");
        AppError::Database(e)
    })
}
