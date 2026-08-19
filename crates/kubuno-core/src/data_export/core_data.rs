//! What the **core** contributes to an archive: the account, and the instance
//! referentials.
//!
//! The modules answer for their own data through
//! [`super::contract`]; this file is the core answering for its own, and it is
//! the one part of the export that always exists — a service picker with every
//! module unticked still produces a complete account sheet, because "who this
//! person is" is the thing every other file in the archive refers to.
//!
//! ## The redaction rule, and why it is a column list
//!
//! Every query below names its columns **explicitly**. Not one uses `SELECT *`,
//! and that is the whole security design of this file rather than a style
//! preference: a `SELECT *` exports whatever the next migration adds, and the
//! next migration is exactly where the next secret arrives. With an explicit
//! list, adding a sensitive column is inert here until somebody deliberately
//! types its name — and typing it means walking past this paragraph.
//!
//! Never exported, and absent from every list below: `password_hash`,
//! `totp_secret`, `totp_pending_secret`, refresh- and verification-token hashes,
//! API token hashes, backup codes, OAuth client secrets, the SMTP password, and
//! the JWT and internal secrets (which are not in the database at all). An
//! archive is read by a human on a laptop; a credential that reaches one has
//! left the instance for good.
//!
//! ## Why JSON, and one CSV
//!
//! JSON for the structured records: it survives a round trip, it is what an
//! importer on the other side will read, and it does not lose a nested field the
//! way a flattened table would. CSV for the audit trail alone, because that one
//! is read by a person scrolling — and it is rendered by
//! [`crate::audit::query::csv_line`], the same writer the console's own export
//! button uses, so the two can never disagree about what a line looks like.

use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;

/// Audit lines carried per account. Generous for a person's own history,
/// bounded so one very active administrator cannot turn their folder into the
/// bulk of the archive. The manifest says when the cap was hit.
const ACCOUNT_AUDIT_LIMIT: i64 = 5_000;

/// Audit lines carried in the instance folder.
const INSTANCE_AUDIT_LIMIT: i64 = 100_000;

/// Runs a query returning a single JSON aggregate.
///
/// Every caller builds its own `SELECT` with an explicit column list; this only
/// removes the repetition of the error handling, which must be identical
/// everywhere or one failing extract ends up silently empty in an archive.
async fn json_rows(db: &PgPool, sql: &str, bind: Option<Uuid>) -> Result<Value, AppError> {
    let query = sqlx::query_scalar::<_, Value>(sql);
    let query = match bind {
        Some(id) => query.bind(id),
        None => query,
    };
    query.fetch_one(db).await.map_err(|e| {
        tracing::error!(error = %e, "export: extraction des données du core impossible");
        AppError::Database(e)
    })
}

// ── One account ──────────────────────────────────────────────────────────────

/// The account sheet: who this person is, where they sit, what they belong to.
///
/// `oauth_id` is included and `oauth_provider` with it: they say *how* somebody
/// signs in, which is part of an honest answer to "what do you hold about me",
/// and neither is a credential — the identifier is issued by the provider and
/// grants nothing on its own.
pub async fn account_profile(db: &PgPool, user_id: Uuid) -> Result<Value, AppError> {
    let profile = json_rows(
        db,
        "SELECT COALESCE(row_to_json(t), 'null'::json) FROM ( \
            SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, u.role, \
                   u.quota_bytes, u.used_bytes, u.is_active, u.email_verified, \
                   u.oauth_provider, u.oauth_id, u.preferences, \
                   u.name_pronunciation, u.pronouns, u.work_location, u.introduction, \
                   u.gender, u.birthday, \
                   u.created_at, u.updated_at, u.last_login_at, u.password_changed_at, \
                   u.totp_enabled, \
                   o.id AS org_unit_id, o.name AS org_unit_name \
              FROM core.users u \
              LEFT JOIN core.org_units o ON o.id = u.org_unit_id \
             WHERE u.id = $1 \
         ) t",
        Some(user_id),
    )
    .await?;

    let groups = json_rows(
        db,
        "SELECT COALESCE(json_agg(t ORDER BY t.name), '[]'::json) FROM ( \
            SELECT g.id, g.name, g.description, m.added_at \
              FROM core.user_group_members m \
              JOIN core.user_groups g ON g.id = m.group_id \
             WHERE m.user_id = $1 \
         ) t",
        Some(user_id),
    )
    .await?;

    // Administrative roles, resolved to their labels. What a person is allowed
    // to do is part of what the instance holds about them, and it is the first
    // thing an auditor asks after "who are they".
    let roles = json_rows(
        db,
        "SELECT COALESCE(json_agg(t ORDER BY t.role_slug), '[]'::json) FROM ( \
            SELECT r.slug AS role_slug, r.name AS role_name, a.scope, \
                   o.name AS scope_org_unit, a.expires_at, a.created_at \
              FROM core.role_assignments a \
              JOIN core.roles r ON r.id = a.role_id \
              LEFT JOIN core.org_units o ON o.id = a.scope_org_unit_id \
             WHERE a.subject_user_id = $1 \
         ) t",
        Some(user_id),
    )
    .await?;

    Ok(json!({
        "profil":  profile,
        "groupes": groups,
        "roles_administratifs": roles,
    }))
}

/// The devices and sessions the instance has seen.
///
/// **No token, and no hash of one.** `token_hash` is the credential — exporting
/// it would hand over a working session — and it is simply not in the column
/// list. What is here is what a person can act on: which device, from where,
/// when, and whether it is still open.
pub async fn account_devices(db: &PgPool, user_id: Uuid) -> Result<Value, AppError> {
    json_rows(
        db,
        "SELECT COALESCE(json_agg(t ORDER BY t.created_at DESC), '[]'::json) FROM ( \
            SELECT id, device_name, device_type, host(ip_address)::text AS ip_address, \
                   user_agent, created_at, last_used_at, expires_at, revoked_at, revoke_reason \
              FROM core.refresh_tokens \
             WHERE user_id = $1 \
         ) t",
        Some(user_id),
    )
    .await
}

/// The administrative audit trail **of what this account did**, as CSV.
///
/// Deliberately not "what was done to them": an entry naming this person as a
/// target usually also names the administrator who acted, and handing one
/// account a file about another account's actions would make the portability
/// answer a disclosure. Entries where they are the target are covered by the
/// instance-level trail, which only an operator receives.
pub async fn account_audit_csv(db: &PgPool, user_id: Uuid) -> Result<String, AppError> {
    let page = crate::audit::query::list(
        db,
        &crate::audit::query::AuditQuery {
            actor_id: Some(user_id),
            limit: Some(ACCOUNT_AUDIT_LIMIT),
            ..Default::default()
        },
    )
    .await?;

    let mut out = String::from(crate::audit::query::CSV_HEADER);
    for row in &page.rows {
        out.push_str(&crate::audit::query::csv_line(row));
    }
    Ok(out)
}

// ── The instance ─────────────────────────────────────────────────────────────

/// Every account, as the directory knows them.
///
/// `deleted_at` is carried rather than filtered on: an account pending erasure
/// is still an account the instance holds data about, and an export that
/// silently omitted it would answer the wrong question.
pub async fn instance_accounts(db: &PgPool) -> Result<Value, AppError> {
    json_rows(
        db,
        "SELECT COALESCE(json_agg(t ORDER BY t.username), '[]'::json) FROM ( \
            SELECT u.id, u.email, u.username, u.display_name, u.role, \
                   u.quota_bytes, u.used_bytes, u.is_active, u.email_verified, \
                   u.oauth_provider, u.totp_enabled, u.org_unit_id, \
                   o.name AS org_unit_name, \
                   u.created_at, u.updated_at, u.last_login_at, u.deleted_at \
              FROM core.users u \
              LEFT JOIN core.org_units o ON o.id = u.org_unit_id \
         ) t",
        None,
    )
    .await
}

/// Groups and their membership.
pub async fn instance_groups(db: &PgPool) -> Result<Value, AppError> {
    json_rows(
        db,
        "SELECT COALESCE(json_agg(t ORDER BY t.name), '[]'::json) FROM ( \
            SELECT g.id, g.name, g.description, g.permissions, g.is_default, \
                   g.created_at, g.updated_at, \
                   COALESCE(( \
                       SELECT json_agg(u.username ORDER BY u.username) \
                         FROM core.user_group_members m \
                         JOIN core.users u ON u.id = m.user_id \
                        WHERE m.group_id = g.id \
                   ), '[]'::json) AS membres \
              FROM core.user_groups g \
         ) t",
        None,
    )
    .await
}

/// The organisational tree, flat, each unit carrying its parent.
pub async fn instance_org_units(db: &PgPool) -> Result<Value, AppError> {
    json_rows(
        db,
        "SELECT COALESCE(json_agg(t ORDER BY t.name), '[]'::json) FROM ( \
            SELECT o.id, o.name, o.parent_id, p.name AS parent_name, \
                   o.created_at, o.updated_at, \
                   (SELECT COUNT(*) FROM core.users u WHERE u.org_unit_id = o.id) AS comptes \
              FROM core.org_units o \
              LEFT JOIN core.org_units p ON p.id = o.parent_id \
         ) t",
        None,
    )
    .await
}

/// The settings of the instance, **with the secret ones redacted**.
///
/// The filter is on the KEY, positively: anything whose name suggests a
/// credential is exported as `"(masqué)"` rather than as its value. Two things
/// make that acceptable rather than a guess:
///
///   * it errs in the safe direction — a harmless setting whose name contains
///     `secret` is redacted, which costs a line of an archive, whereas the
///     opposite error costs the instance;
///   * the settings that genuinely hold a credential (the SMTP password, the
///     OAuth client secrets) are stored **encrypted**, so what this would
///     otherwise export is ciphertext — and ciphertext in an archive is a
///     credential waiting for the day the key leaks.
pub async fn instance_settings(db: &PgPool) -> Result<Value, AppError> {
    json_rows(
        db,
        "SELECT COALESCE(json_agg(t ORDER BY t.key), '[]'::json) FROM ( \
            SELECT s.key, s.category, s.label, s.description, s.value_type, \
                   s.default_value, s.updated_at, \
                   CASE WHEN s.key ~* '(secret|password|token|api_key|private_key|passphrase)' \
                        THEN to_jsonb('(masqué)'::text) \
                        ELSE COALESCE( \
                            (SELECT v.value FROM core.setting_values v \
                              WHERE v.key = s.key AND v.scope_type = 'instance'), \
                            s.default_value) \
                   END AS value \
              FROM core.settings s \
         ) t",
        None,
    )
    .await
}

/// The whole administrative audit trail, as CSV.
pub async fn instance_audit_csv(db: &PgPool) -> Result<String, AppError> {
    let mut out = String::from(crate::audit::query::CSV_HEADER);
    let mut cursor: Option<String> = None;
    let mut written: i64 = 0;

    // Paged rather than fetched in one statement: the trail of a long-lived
    // instance is millions of rows, and a single `fetch_all` would hold all of
    // them in memory at once, inside a background job that is also holding an
    // archive open.
    loop {
        let page = crate::audit::query::list(
            db,
            &crate::audit::query::AuditQuery {
                limit: Some(1_000),
                cursor: cursor.clone(),
                ..Default::default()
            },
        )
        .await?;

        for row in &page.rows {
            out.push_str(&crate::audit::query::csv_line(row));
        }
        written += page.rows.len() as i64;

        match page.next_cursor {
            Some(next) if written < INSTANCE_AUDIT_LIMIT => cursor = Some(next),
            _ => break,
        }
    }
    Ok(out)
}
