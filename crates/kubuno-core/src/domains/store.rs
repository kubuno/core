//! Reading and writing the registry, and the four rules that make it a model
//! rather than a list of strings.
//!
//!   1. **Exactly one primary.** Held by a unique index, swapped in one
//!      transaction, never by two statements a crash could interleave.
//!   2. **A promotion, not a creation.** A domain becomes primary only if it is
//!      already declared *and* verified — the same order the reference imposes,
//!      and for the same reason: the instance's own name is the one thing that
//!      must never be a claim.
//!   3. **An alias hangs off a real domain.** Its parent is the primary or a
//!      secondary, never another alias: an alias of an alias is a chain nobody
//!      can read and every consumer would have to walk.
//!   4. **Nothing is removed out from under an account.** A domain carrying
//!      addresses refuses to go until they are moved, and says how many.

use chrono::Utc;
use serde_json::{json, Value};
use sqlx::{postgres::PgRow, PgConnection, PgPool, Row};
use uuid::Uuid;

use super::dns;
use super::model::{Domain, DomainKind};
use crate::errors::AppError;

/// Columns every read shares, account count included.
const SELECT_DOMAINS: &str = r#"
    SELECT d.id, d.name, d.kind, d.parent_id, p.name AS parent_name,
           d.verify_token, d.verified_at, d.last_checked_at, d.last_error,
           d.mx_hosts, d.has_spf, d.has_dmarc, d.mail_checked_at, d.created_at,
           (SELECT COUNT(*) FROM core.users u
             WHERE LOWER(SPLIT_PART(u.email::text, '@', 2)) = d.name)::bigint AS account_count
      FROM core.domains d
      LEFT JOIN core.domains p ON p.id = d.parent_id
"#;

fn from_row(row: &PgRow) -> Result<Domain, AppError> {
    let kind: String = row.try_get("kind").map_err(AppError::Database)?;
    Ok(Domain {
        id: row.try_get("id").map_err(AppError::Database)?,
        name: row.try_get("name").map_err(AppError::Database)?,
        kind: DomainKind::parse(&kind)?,
        parent_id: row.try_get("parent_id").map_err(AppError::Database)?,
        parent_name: row.try_get("parent_name").map_err(AppError::Database)?,
        verify_token: row.try_get("verify_token").map_err(AppError::Database)?,
        verified_at: row.try_get("verified_at").map_err(AppError::Database)?,
        last_checked_at: row.try_get("last_checked_at").map_err(AppError::Database)?,
        last_error: row.try_get("last_error").map_err(AppError::Database)?,
        mx_hosts: row.try_get("mx_hosts").map_err(AppError::Database)?,
        has_spf: row.try_get("has_spf").map_err(AppError::Database)?,
        has_dmarc: row.try_get("has_dmarc").map_err(AppError::Database)?,
        mail_checked_at: row.try_get("mail_checked_at").map_err(AppError::Database)?,
        created_at: row.try_get("created_at").map_err(AppError::Database)?,
        account_count: row.try_get("account_count").map_err(AppError::Database)?,
    })
}

/// Every domain, the primary first, then aliases grouped under the domain they
/// serve — the order the console renders without having to sort.
pub async fn list(db: &PgPool) -> Result<Vec<Domain>, AppError> {
    let rows = sqlx::query(&format!(
        "{SELECT_DOMAINS} ORDER BY (d.kind = 'primary') DESC, COALESCE(p.name, d.name), d.kind, d.name"
    ))
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "domains: liste");
        AppError::Database(e)
    })?;
    rows.iter().map(from_row).collect()
}

pub async fn get(db: &PgPool, id: Uuid) -> Result<Domain, AppError> {
    let row = sqlx::query(&format!("{SELECT_DOMAINS} WHERE d.id = $1"))
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "domains: lecture");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Domaine introuvable".into()))?;
    from_row(&row)
}

/// Is `name` a domain this instance has *proven* it controls?
///
/// The question every consumer asks, and the reason the registry exists. An
/// alias answers yes: an address at an alias is an address of this instance.
pub async fn is_verified(db: &PgPool, name: &str) -> bool {
    match sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM core.domains WHERE name = $1 AND verified_at IS NOT NULL)",
    )
    .bind(name.trim().to_ascii_lowercase())
    .fetch_one(db)
    .await
    {
        Ok(found) => found,
        Err(e) => {
            // Never fatal, and never a silent "yes": a caller that cannot read
            // the registry must not be told the domain is fine.
            tracing::error!(error = %e, "domains: vérification d'appartenance");
            false
        }
    }
}

/// The verified names, for a picker.
pub async fn verified_names(db: &PgPool) -> Vec<String> {
    sqlx::query_scalar::<_, String>(
        "SELECT name FROM core.domains WHERE verified_at IS NOT NULL \
          ORDER BY (kind = 'primary') DESC, name",
    )
    .fetch_all(db)
    .await
    .unwrap_or_else(|e| {
        tracing::error!(error = %e, "domains: liste des domaines vérifiés");
        Vec::new()
    })
}

/// Declares a domain. Secondary or alias only — the primary is never created,
/// it is promoted (see [`promote`]).
pub async fn create(
    conn: &mut PgConnection,
    name: &str,
    kind: DomainKind,
    parent_id: Option<Uuid>,
    actor: Uuid,
) -> Result<Uuid, AppError> {
    if kind == DomainKind::Primary {
        return Err(AppError::Validation(
            "Le domaine principal ne se crée pas : ajoutez le domaine, vérifiez-le, puis promouvez-le.".into(),
        ));
    }

    // An alias hangs off a real domain, and off one that is itself proven:
    // lending addresses from a name nobody has verified would launder the very
    // claim the registry exists to check.
    if kind == DomainKind::Alias {
        let parent_id = parent_id.ok_or_else(|| {
            AppError::Validation("Un alias doit désigner le domaine dont il reprend les adresses.".into())
        })?;
        let parent = sqlx::query("SELECT kind, verified_at FROM core.domains WHERE id = $1")
            .bind(parent_id)
            .fetch_optional(&mut *conn)
            .await
            .map_err(AppError::Database)?
            .ok_or_else(|| AppError::Validation("Le domaine désigné n'existe pas.".into()))?;
        if parent.get::<String, _>("kind") == "alias" {
            return Err(AppError::Validation(
                "Un alias ne peut pas désigner un autre alias : rattachez-le au domaine d'origine.".into(),
            ));
        }
        if parent.get::<Option<chrono::DateTime<Utc>>, _>("verified_at").is_none() {
            return Err(AppError::Validation(
                "Vérifiez d'abord le domaine dont cet alias reprend les adresses.".into(),
            ));
        }
    } else if parent_id.is_some() {
        return Err(AppError::Validation(
            "Seul un alias désigne un domaine d'origine.".into(),
        ));
    }

    // The raw half of a CSPRNG token, kept alphanumeric: it is pasted by hand
    // into a registrar's form, and `-`/`_` are exactly the characters people
    // lose when they retype it. Thirty-two characters is far past guessing.
    let (raw, _hash) = crate::crypto::token::generate_token();
    let token: String = raw.chars().filter(|c| c.is_ascii_alphanumeric()).take(32).collect();

    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO core.domains (name, kind, parent_id, verify_token, created_by) \
         VALUES ($1, $2, $3, $4, $5) RETURNING id",
    )
    .bind(name)
    .bind(kind.as_str())
    .bind(parent_id)
    .bind(&token)
    .bind(actor)
    .fetch_one(&mut *conn)
    .await
    .map_err(|e| {
        if let sqlx::Error::Database(db) = &e {
            if db.is_unique_violation() {
                return AppError::Conflict(format!("Le domaine « {name} » est déjà déclaré ici."));
            }
        }
        tracing::error!(error = %e, domain = %name, "domains: création");
        AppError::Database(e)
    })?;
    Ok(id)
}

/// Runs the ownership probe and records what it saw.
///
/// Idempotent and re-runnable: an administrator who publishes the record ten
/// minutes later presses the same button, and a domain that was verified stays
/// verified even if a later probe fails — a registrar hiccup must not silently
/// un-own a domain that accounts already depend on.
pub async fn verify(db: &PgPool, id: Uuid) -> Result<Domain, AppError> {
    let domain = get(db, id).await?;
    let probe = dns::check_verification(&domain.name, &domain.verify_token).await;

    match probe {
        Ok(result) if result.found => {
            sqlx::query(
                "UPDATE core.domains \
                    SET verified_at = COALESCE(verified_at, NOW()), last_checked_at = NOW(), last_error = NULL \
                  WHERE id = $1",
            )
            .bind(id)
            .execute(db)
            .await
            .map_err(AppError::Database)?;
        }
        Ok(result) => {
            let mut message = "L'enregistrement TXT attendu n'a pas été trouvé sur ce domaine.".to_string();
            if !result.others.is_empty() {
                // The near-miss worth naming: a token from another instance, or
                // one published on the wrong name.
                message.push_str(&format!(
                    " D'autres jetons de vérification sont publiés : {}.",
                    result.others.join(", ")
                ));
            }
            record_failure(db, id, &message).await?;
        }
        Err(e) => record_failure(db, id, &e.message()).await?,
    }

    get(db, id).await
}

async fn record_failure(db: &PgPool, id: Uuid, message: &str) -> Result<(), AppError> {
    sqlx::query("UPDATE core.domains SET last_checked_at = NOW(), last_error = $2 WHERE id = $1")
        .bind(id)
        .bind(message)
        .execute(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "domains: enregistrement de l'échec de vérification");
            AppError::Database(e)
        })?;
    Ok(())
}

/// Refreshes the mail diagnosis of one domain.
pub async fn refresh_mail(db: &PgPool, id: Uuid) -> Result<Domain, AppError> {
    let domain = get(db, id).await?;
    let probe = dns::probe_mail(&domain.name).await;

    // A probe that could not run leaves the previous answer in place rather than
    // overwriting a real diagnosis with three falses.
    if probe.error.is_none() {
        sqlx::query(
            "UPDATE core.domains SET mx_hosts = $2, has_spf = $3, has_dmarc = $4, mail_checked_at = NOW() \
              WHERE id = $1",
        )
        .bind(id)
        .bind(json!(probe.mx))
        .bind(probe.spf)
        .bind(probe.dmarc)
        .execute(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "domains: enregistrement du diagnostic de messagerie");
            AppError::Database(e)
        })?;
    }
    get(db, id).await
}

/// Promotes a verified secondary domain to primary, demoting the current one.
///
/// One transaction, because the unique index means the intermediate state — two
/// primaries, or none — cannot be allowed to exist even for a statement.
pub async fn promote(conn: &mut PgConnection, id: Uuid) -> Result<(String, Option<String>), AppError> {
    let row = sqlx::query("SELECT name, kind, verified_at FROM core.domains WHERE id = $1 FOR UPDATE")
        .bind(id)
        .fetch_optional(&mut *conn)
        .await
        .map_err(AppError::Database)?
        .ok_or_else(|| AppError::NotFound("Domaine introuvable".into()))?;

    let name: String = row.get("name");
    match row.get::<String, _>("kind").as_str() {
        "primary" => {
            return Err(AppError::Validation(format!(
                "« {name} » est déjà le domaine principal."
            )))
        }
        "alias" => {
            return Err(AppError::Validation(
                "Un alias ne peut pas devenir le domaine principal : il ne porte aucun compte.".into(),
            ))
        }
        _ => {}
    }
    if row.get::<Option<chrono::DateTime<Utc>>, _>("verified_at").is_none() {
        return Err(AppError::Validation(format!(
            "Vérifiez « {name} » avant d'en faire le domaine principal."
        )));
    }

    // The outgoing primary becomes a secondary rather than disappearing: its
    // accounts keep their addresses, and the instance keeps answering for it.
    let previous: Option<String> = sqlx::query_scalar(
        "UPDATE core.domains SET kind = 'secondary' WHERE kind = 'primary' RETURNING name",
    )
    .fetch_optional(&mut *conn)
    .await
    .map_err(AppError::Database)?;

    sqlx::query("UPDATE core.domains SET kind = 'primary' WHERE id = $1")
        .bind(id)
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "domains: promotion");
            AppError::Database(e)
        })?;

    Ok((name, previous))
}

/// What stands between a domain and its removal, named rather than counted.
///
/// Returned as a list so the console can show a checklist instead of a single
/// refusal: the reference does exactly this, and it is the difference between
/// "impossible" and "voilà ce qu'il reste à faire".
pub async fn removal_blockers(db: &PgPool, domain: &Domain) -> Result<Vec<String>, AppError> {
    let mut blockers = Vec::new();

    if domain.kind == DomainKind::Primary {
        blockers.push(
            "C'est le domaine principal de l'instance. Promouvez d'abord un autre domaine.".to_string(),
        );
    }
    if domain.account_count > 0 {
        blockers.push(format!(
            "{} compte(s) portent une adresse à ce domaine. Changez leur adresse avant de le retirer.",
            domain.account_count
        ));
    }

    let aliases: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.domains WHERE parent_id = $1",
    )
    .bind(domain.id)
    .fetch_one(db)
    .await
    .map_err(AppError::Database)?;
    if aliases > 0 {
        blockers.push(format!(
            "{aliases} alias reprennent les adresses de ce domaine. Retirez-les d'abord."
        ));
    }

    Ok(blockers)
}

/// Removes a domain once nothing stands in the way.
pub async fn delete(conn: &mut PgConnection, id: Uuid) -> Result<(), AppError> {
    sqlx::query("DELETE FROM core.domains WHERE id = $1")
        .bind(id)
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "domains: suppression");
            AppError::Database(e)
        })?;
    Ok(())
}

/// The registry, summarised for the page header.
pub async fn overview(db: &PgPool) -> Result<Value, AppError> {
    let row = sqlx::query(
        r#"SELECT COUNT(*)::bigint                                              AS total,
                  COUNT(*) FILTER (WHERE verified_at IS NOT NULL)::bigint       AS verified,
                  COUNT(*) FILTER (WHERE verified_at IS NULL)::bigint           AS pending,
                  COUNT(*) FILTER (WHERE kind = 'alias')::bigint                AS aliases,
                  (SELECT name FROM core.domains WHERE kind = 'primary')        AS primary_name
             FROM core.domains"#,
    )
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "domains: état du registre");
        AppError::Database(e)
    })?;

    Ok(json!({
        "total":        row.get::<i64, _>("total"),
        "verified":     row.get::<i64, _>("verified"),
        "pending":      row.get::<i64, _>("pending"),
        "aliases":      row.get::<i64, _>("aliases"),
        "primary_name": row.get::<Option<String>, _>("primary_name"),
    }))
}
