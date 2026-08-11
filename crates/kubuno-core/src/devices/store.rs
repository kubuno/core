//! Reads and writes of the device inventory.
//!
//! Every query lists its columns. `SELECT *` would carry
//! `core.devices.correlation_hash` — the one value in this feature that must
//! never leave the database — into a struct that serialises itself, and the
//! only reliable defence against that is to never write the star.
//!
//! ## One shape for both audiences
//!
//! The administrator's list and the user's own screen run through the *same*
//! functions, differing only in their `WHERE`. That is the trust contract of a
//! self-hosted platform stated as code: a user cannot be shown less about their
//! own machines than the operator sees, because there is no second query that
//! could drift.

use serde::Deserialize;
use sqlx::{PgConnection, PgPool, Postgres, QueryBuilder, Row};
use uuid::Uuid;

use super::model::{event_kind, Approval, DeviceEventRow, DeviceRow, SessionRow};
use crate::authz::{keys, AdminContext};
use crate::errors::AppError;

/// Columns of `core.devices` that may leave the server, plus the two joins the
/// console needs. `correlation_hash` is absent, deliberately and permanently.
const DEVICE_COLUMNS: &str = r#"
    d.id, d.user_id,
    COALESCE(NULLIF(u.display_name, ''), u.username) AS user_label,
    d.correlation_kind, d.label, d.device_type, d.client_kind,
    d.platform, d.platform_version, d.browser, d.browser_version,
    d.signal_level, d.disk_encrypted, d.screen_lock,
    d.declared_platform, d.declared_version, d.declared_app_version, d.declared_at,
    d.first_seen_at, d.last_seen_at, host(d.last_ip)::text AS last_ip, d.last_country,
    d.approval, d.approval_by, d.approval_label, d.approval_at, d.approval_reason,
    (SELECT COUNT(*) FROM core.refresh_tokens rt
      WHERE rt.device_id = d.id AND rt.revoked_at IS NULL AND rt.expires_at > NOW())::bigint
      AS active_sessions
"#;

const DEVICE_FROM: &str = " FROM core.devices d JOIN core.users u ON u.id = d.user_id ";

/// Columns of a session row. `token_hash` is absent for the same reason.
const SESSION_COLUMNS: &str = r#"
    rt.id, rt.user_id,
    COALESCE(NULLIF(u.display_name, ''), u.username) AS user_label,
    rt.device_id,
    COALESCE(d.label, NULLIF(TRIM(CONCAT_WS(' ', d.browser, d.platform)), ''), rt.device_name)
        AS device_label,
    rt.device_name, rt.device_type, rt.client_type,
    host(rt.ip_address)::text AS ip_address, rt.country, rt.auth_strength,
    rt.user_agent, rt.created_at, rt.last_used_at, rt.expires_at
"#;

const SESSION_FROM: &str = r#"
     FROM core.refresh_tokens rt
     JOIN core.users u ON u.id = rt.user_id
     LEFT JOIN core.devices d ON d.id = rt.device_id
"#;

const DEFAULT_LIMIT: i64 = 50;
const MAX_LIMIT: i64 = 200;

/// Filters offered by the administration list.
#[derive(Debug, Default, Deserialize)]
pub struct DeviceQuery {
    /// Free text over label, platform, browser and the account.
    pub q: Option<String>,
    pub device_type: Option<String>,
    pub platform: Option<String>,
    pub approval: Option<String>,
    pub country: Option<String>,
    /// Seen within the last N days. `0`/absent means no bound.
    pub seen_days: Option<i64>,
    pub user_id: Option<Uuid>,
    pub signal_level: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

fn clean(value: &Option<String>) -> Option<&str> {
    value.as_deref().map(str::trim).filter(|v| !v.is_empty())
}

fn map_device(row: &sqlx::postgres::PgRow) -> DeviceRow {
    DeviceRow {
        id: row.get("id"),
        user_id: row.get("user_id"),
        user_label: row.get("user_label"),
        correlation_kind: row.get("correlation_kind"),
        label: row.get("label"),
        device_type: row.get("device_type"),
        client_kind: row.get("client_kind"),
        platform: row.get("platform"),
        platform_version: row.get("platform_version"),
        browser: row.get("browser"),
        browser_version: row.get("browser_version"),
        signal_level: row.get("signal_level"),
        disk_encrypted_raw: row.get("disk_encrypted"),
        screen_lock_raw: row.get("screen_lock"),
        declared_platform: row.get("declared_platform"),
        declared_version: row.get("declared_version"),
        declared_app_version: row.get("declared_app_version"),
        declared_at: row.get("declared_at"),
        first_seen_at: row.get("first_seen_at"),
        last_seen_at: row.get("last_seen_at"),
        last_ip: row.get("last_ip"),
        last_country: row.get("last_country"),
        approval: row.get("approval"),
        approval_by: row.get("approval_by"),
        approval_label: row.get("approval_label"),
        approval_at: row.get("approval_at"),
        approval_reason: row.get("approval_reason"),
        active_sessions: row.get("active_sessions"),
    }
}

fn map_session(row: &sqlx::postgres::PgRow) -> SessionRow {
    SessionRow {
        id: row.get("id"),
        user_id: row.get("user_id"),
        user_label: row.get("user_label"),
        device_id: row.get("device_id"),
        device_label: row.get("device_label"),
        device_name: row.get("device_name"),
        device_type: row.get("device_type"),
        client_type: row.get("client_type"),
        ip_address: row.get("ip_address"),
        country: row.get("country"),
        auth_strength: row.get("auth_strength"),
        user_agent: row.get("user_agent"),
        created_at: row.get("created_at"),
        last_used_at: row.get("last_used_at"),
        expires_at: row.get("expires_at"),
    }
}

/// Appends the organisational perimeter of the caller.
///
/// A delegated operator confined to a branch sees the devices of the accounts
/// in that branch and nothing else. An empty subtree matches nothing, which is
/// the correct answer for somebody who does not hold the key at all.
fn push_scope(builder: &mut QueryBuilder<'_, Postgres>, ctx: &AdminContext, column: &str) {
    if let Some(units) = ctx.subtree_filter(keys::SESSIONS_READ) {
        builder.push(format!(
            " AND {column} IS NOT NULL AND {column} = ANY("
        ));
        builder.push_bind(units);
        builder.push(")");
    }
}

/// The administration list.
pub async fn list(
    db: &PgPool,
    query: &DeviceQuery,
    ctx: &AdminContext,
) -> Result<(Vec<DeviceRow>, i64), AppError> {
    let limit = query.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
    let offset = query.offset.unwrap_or(0).max(0);

    let mut builder = QueryBuilder::<Postgres>::new("SELECT ");
    builder.push(DEVICE_COLUMNS).push(DEVICE_FROM).push(" WHERE TRUE ");
    push_filters(&mut builder, query, ctx);
    builder.push(" ORDER BY d.last_seen_at DESC, d.id DESC LIMIT ");
    builder.push_bind(limit);
    builder.push(" OFFSET ");
    builder.push_bind(offset);

    let rows = builder.build().fetch_all(db).await.map_err(|e| {
        tracing::error!(error = %e, "devices: lecture de l'inventaire");
        AppError::Database(e)
    })?;

    // The total obeys the same perimeter and the same filters, or the pagination
    // announces devices the caller may not see.
    let mut counter = QueryBuilder::<Postgres>::new("SELECT COUNT(*)::bigint");
    counter.push(DEVICE_FROM).push(" WHERE TRUE ");
    push_filters(&mut counter, query, ctx);
    let total: i64 = counter
        .build_query_scalar()
        .fetch_one(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "devices: total de l'inventaire");
            AppError::Database(e)
        })?;

    Ok((rows.iter().map(map_device).collect(), total))
}

fn push_filters(builder: &mut QueryBuilder<'_, Postgres>, query: &DeviceQuery, ctx: &AdminContext) {
    push_scope(builder, ctx, "u.org_unit_id");

    if let Some(text) = clean(&query.q) {
        builder.push(
            " AND (d.label ILIKE '%' || ",
        );
        builder.push_bind(text.to_string());
        builder.push(" || '%' OR d.platform ILIKE '%' || ");
        builder.push_bind(text.to_string());
        builder.push(" || '%' OR d.browser ILIKE '%' || ");
        builder.push_bind(text.to_string());
        builder.push(" || '%' OR u.username ILIKE '%' || ");
        builder.push_bind(text.to_string());
        builder.push(" || '%' OR u.email ILIKE '%' || ");
        builder.push_bind(text.to_string());
        builder.push(" || '%')");
    }
    if let Some(value) = clean(&query.device_type) {
        builder.push(" AND d.device_type = ");
        builder.push_bind(value.to_string());
    }
    if let Some(value) = clean(&query.platform) {
        builder.push(" AND d.platform = ");
        builder.push_bind(value.to_string());
    }
    if let Some(value) = clean(&query.approval) {
        builder.push(" AND d.approval = ");
        builder.push_bind(value.to_string());
    }
    if let Some(value) = clean(&query.signal_level) {
        builder.push(" AND d.signal_level = ");
        builder.push_bind(value.to_string());
    }
    if let Some(value) = clean(&query.country) {
        builder.push(" AND d.last_country = ");
        builder.push_bind(value.to_uppercase());
    }
    if let Some(days) = query.seen_days.filter(|d| *d > 0) {
        builder.push(" AND d.last_seen_at >= NOW() - make_interval(days => ");
        builder.push_bind(days as i32);
        builder.push(")");
    }
    if let Some(user_id) = query.user_id {
        builder.push(" AND d.user_id = ");
        builder.push_bind(user_id);
    }
}

/// Distinct values present in the caller's perimeter, so the filter selects
/// offer what exists rather than a catalogue of empty answers.
pub async fn facets(
    db: &PgPool,
    ctx: &AdminContext,
) -> Result<(Vec<String>, Vec<String>, Vec<String>), AppError> {
    let mut builder = QueryBuilder::<Postgres>::new(
        "SELECT DISTINCT d.platform, d.last_country, d.device_type",
    );
    builder.push(DEVICE_FROM).push(" WHERE TRUE ");
    push_scope(&mut builder, ctx, "u.org_unit_id");

    let rows = builder.build().fetch_all(db).await.map_err(|e| {
        tracing::error!(error = %e, "devices: facettes");
        AppError::Database(e)
    })?;

    let mut platforms: Vec<String> = Vec::new();
    let mut countries: Vec<String> = Vec::new();
    let mut types: Vec<String> = Vec::new();
    for row in &rows {
        if let Some(p) = row.get::<Option<String>, _>("platform") {
            if !platforms.contains(&p) {
                platforms.push(p);
            }
        }
        if let Some(c) = row.get::<Option<String>, _>("last_country") {
            if !countries.contains(&c) {
                countries.push(c);
            }
        }
        let t: String = row.get("device_type");
        if !types.contains(&t) {
            types.push(t);
        }
    }
    platforms.sort();
    countries.sort();
    types.sort();
    Ok((platforms, countries, types))
}

/// One device, checked against the caller's perimeter.
pub async fn get(db: &PgPool, id: Uuid, ctx: &AdminContext) -> Result<DeviceRow, AppError> {
    let mut builder = QueryBuilder::<Postgres>::new("SELECT ");
    builder.push(DEVICE_COLUMNS).push(DEVICE_FROM).push(" WHERE d.id = ");
    builder.push_bind(id);
    push_scope(&mut builder, ctx, "u.org_unit_id");

    let row = builder.build().fetch_optional(db).await.map_err(|e| {
        tracing::error!(error = %e, device_id = %id, "devices: lecture d'un appareil");
        AppError::Database(e)
    })?;

    // Outside the perimeter reads as "does not exist", which is also what an
    // enumeration attempt must be told.
    row.as_ref()
        .map(map_device)
        .ok_or_else(|| AppError::NotFound("Appareil introuvable".into()))
}

/// One device owned by a given account. Used by the personal screen, where the
/// only perimeter is "is it mine".
pub async fn get_owned(db: &PgPool, id: Uuid, user_id: Uuid) -> Result<DeviceRow, AppError> {
    let sql = format!("SELECT {DEVICE_COLUMNS} {DEVICE_FROM} WHERE d.id = $1 AND d.user_id = $2");
    let row = sqlx::query(&sql)
        .bind(id)
        .bind(user_id)
        .fetch_optional(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, device_id = %id, "devices: lecture d'un appareil personnel");
            AppError::Database(e)
        })?;
    row.as_ref()
        .map(map_device)
        .ok_or_else(|| AppError::NotFound("Appareil introuvable".into()))
}

/// Every device of one account, most recently seen first.
pub async fn for_user(db: &PgPool, user_id: Uuid) -> Result<Vec<DeviceRow>, AppError> {
    let sql = format!(
        "SELECT {DEVICE_COLUMNS} {DEVICE_FROM} WHERE d.user_id = $1 \
         ORDER BY d.last_seen_at DESC, d.id DESC"
    );
    let rows = sqlx::query(&sql)
        .bind(user_id)
        .fetch_all(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, user_id = %user_id, "devices: appareils d'un compte");
            AppError::Database(e)
        })?;
    Ok(rows.iter().map(map_device).collect())
}

/// Live sessions attached to a device.
pub async fn sessions_of(db: &PgPool, device_id: Uuid) -> Result<Vec<SessionRow>, AppError> {
    let sql = format!(
        "SELECT {SESSION_COLUMNS} {SESSION_FROM} \
         WHERE rt.device_id = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW() \
         ORDER BY rt.last_used_at DESC"
    );
    let rows = sqlx::query(&sql)
        .bind(device_id)
        .fetch_all(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, device_id = %device_id, "devices: sessions de l'appareil");
            AppError::Database(e)
        })?;
    Ok(rows.iter().map(map_session).collect())
}

/// Live sessions of one account, whatever their device.
pub async fn sessions_of_user(db: &PgPool, user_id: Uuid) -> Result<Vec<SessionRow>, AppError> {
    let sql = format!(
        "SELECT {SESSION_COLUMNS} {SESSION_FROM} \
         WHERE rt.user_id = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW() \
         ORDER BY rt.last_used_at DESC"
    );
    let rows = sqlx::query(&sql)
        .bind(user_id)
        .fetch_all(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, user_id = %user_id, "devices: sessions du compte");
            AppError::Database(e)
        })?;
    Ok(rows.iter().map(map_session).collect())
}

/// Filters of the instance-wide session list.
#[derive(Debug, Default, Deserialize)]
pub struct SessionQuery {
    pub q: Option<String>,
    pub client_type: Option<String>,
    pub country: Option<String>,
    pub user_id: Option<Uuid>,
    /// `true` keeps only sessions that never passed a second factor.
    pub without_2fa: Option<bool>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

/// Every live session of the instance — a view that simply did not exist.
///
/// Until now the only way to answer "who is currently signed in" was to open
/// each account in turn, which meant nobody ever asked.
pub async fn all_sessions(
    db: &PgPool,
    query: &SessionQuery,
    ctx: &AdminContext,
) -> Result<(Vec<SessionRow>, i64), AppError> {
    let limit = query.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
    let offset = query.offset.unwrap_or(0).max(0);

    let mut builder = QueryBuilder::<Postgres>::new("SELECT ");
    builder
        .push(SESSION_COLUMNS)
        .push(SESSION_FROM)
        .push(" WHERE rt.revoked_at IS NULL AND rt.expires_at > NOW() ");
    push_session_filters(&mut builder, query, ctx);
    builder.push(" ORDER BY rt.last_used_at DESC, rt.id DESC LIMIT ");
    builder.push_bind(limit);
    builder.push(" OFFSET ");
    builder.push_bind(offset);

    let rows = builder.build().fetch_all(db).await.map_err(|e| {
        tracing::error!(error = %e, "devices: liste globale des sessions");
        AppError::Database(e)
    })?;

    let mut counter = QueryBuilder::<Postgres>::new("SELECT COUNT(*)::bigint");
    counter
        .push(SESSION_FROM)
        .push(" WHERE rt.revoked_at IS NULL AND rt.expires_at > NOW() ");
    push_session_filters(&mut counter, query, ctx);
    let total: i64 = counter.build_query_scalar().fetch_one(db).await.map_err(|e| {
        tracing::error!(error = %e, "devices: total des sessions");
        AppError::Database(e)
    })?;

    Ok((rows.iter().map(map_session).collect(), total))
}

fn push_session_filters(
    builder: &mut QueryBuilder<'_, Postgres>,
    query: &SessionQuery,
    ctx: &AdminContext,
) {
    push_scope(builder, ctx, "u.org_unit_id");

    if let Some(text) = clean(&query.q) {
        builder.push(" AND (u.username ILIKE '%' || ");
        builder.push_bind(text.to_string());
        builder.push(" || '%' OR u.email ILIKE '%' || ");
        builder.push_bind(text.to_string());
        builder.push(" || '%' OR rt.device_name ILIKE '%' || ");
        builder.push_bind(text.to_string());
        builder.push(" || '%' OR host(rt.ip_address) ILIKE '%' || ");
        builder.push_bind(text.to_string());
        builder.push(" || '%')");
    }
    if let Some(value) = clean(&query.client_type) {
        builder.push(" AND rt.client_type = ");
        builder.push_bind(value.to_string());
    }
    if let Some(value) = clean(&query.country) {
        builder.push(" AND rt.country = ");
        builder.push_bind(value.to_uppercase());
    }
    if let Some(user_id) = query.user_id {
        builder.push(" AND rt.user_id = ");
        builder.push_bind(user_id);
    }
    if query.without_2fa == Some(true) {
        // NULL is "we do not know", and an unknown strength must not be counted
        // as "passed 2FA" — the tri-state rule, applied to a session.
        builder.push(" AND (rt.auth_strength IS NULL OR rt.auth_strength NOT IN ('password_totp', 'backup_code'))");
    }
}

/// The last lines of a device timeline.
pub async fn events_of(
    db: &PgPool,
    device_id: Uuid,
    limit: i64,
) -> Result<Vec<DeviceEventRow>, AppError> {
    let rows = sqlx::query_as::<_, DeviceEventRow>(
        "SELECT id, occurred_at, kind, host(ip_address)::text AS ip_address, country,
                actor_id, actor_label, detail
           FROM core.device_events
          WHERE device_id = $1
          ORDER BY occurred_at DESC, id DESC
          LIMIT $2",
    )
    .bind(device_id)
    .bind(limit.clamp(1, 200))
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, device_id = %device_id, "devices: journal de l'appareil");
        AppError::Database(e)
    })?;
    Ok(rows)
}

/// Sets the approval state of a device, inside a caller-supplied transaction.
///
/// Returns the previous state so the audit entry can carry a real `before`.
pub async fn set_approval(
    conn: &mut PgConnection,
    device_id: Uuid,
    next: Approval,
    actor_id: Uuid,
    actor_label: &str,
    reason: Option<&str>,
) -> Result<Approval, AppError> {
    let previous: String = sqlx::query_scalar(
        "SELECT approval FROM core.devices WHERE id = $1 FOR UPDATE",
    )
    .bind(device_id)
    .fetch_optional(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, device_id = %device_id, "devices: lecture de l'approbation");
        AppError::Database(e)
    })?
    .ok_or_else(|| AppError::NotFound("Appareil introuvable".into()))?;

    sqlx::query(
        "UPDATE core.devices
            SET approval = $2, approval_by = $3, approval_label = $4,
                approval_at = NOW(), approval_reason = $5
          WHERE id = $1",
    )
    .bind(device_id)
    .bind(next.as_str())
    .bind(actor_id)
    .bind(actor_label)
    .bind(reason)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, device_id = %device_id, "devices: écriture de l'approbation");
        AppError::Database(e)
    })?;

    let kind = match next {
        Approval::Approved => event_kind::APPROVED,
        Approval::Blocked => event_kind::BLOCKED,
        Approval::Pending => event_kind::UNBLOCKED,
    };
    super::correlate::record_event_tx(
        &mut *conn,
        device_id,
        kind,
        Some(actor_id),
        Some(actor_label),
        reason,
    )
    .await?;

    Ok(Approval::parse(&previous).unwrap_or(Approval::Pending))
}

/// Revokes every live session of a device. Returns how many were closed.
pub async fn revoke_sessions(
    conn: &mut PgConnection,
    device_id: Uuid,
    reason: &str,
) -> Result<u64, AppError> {
    let affected = sqlx::query(
        "UPDATE core.refresh_tokens
            SET revoked_at = NOW(), revoke_reason = $2
          WHERE device_id = $1 AND revoked_at IS NULL",
    )
    .bind(device_id)
    .bind(reason)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, device_id = %device_id, "devices: révocation des sessions");
        AppError::Database(e)
    })?
    .rows_affected();
    Ok(affected)
}

/// Removes an inventory row.
///
/// ⚠ This erases **nothing on the device**. It deletes what the server
/// remembered about it; the machine keeps every file it already holds, and the
/// interface says so in as many words because it is the misreading everybody
/// makes. `refresh_tokens.device_id` is `ON DELETE SET NULL`, so sessions
/// survive — forgetting is not a sign-out, and the console offers both.
pub async fn forget(conn: &mut PgConnection, device_id: Uuid) -> Result<(), AppError> {
    let affected = sqlx::query("DELETE FROM core.devices WHERE id = $1")
        .bind(device_id)
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, device_id = %device_id, "devices: oubli de l'appareil");
            AppError::Database(e)
        })?
        .rows_affected();
    if affected == 0 {
        return Err(AppError::NotFound("Appareil introuvable".into()));
    }
    Ok(())
}

/// Renames a device. Empty clears the custom name and restores the description
/// derived from the user agent.
pub async fn rename(db: &PgPool, device_id: Uuid, user_id: Uuid, label: Option<&str>) -> Result<(), AppError> {
    let affected = sqlx::query(
        "UPDATE core.devices SET label = $3 WHERE id = $1 AND user_id = $2",
    )
    .bind(device_id)
    .bind(user_id)
    .bind(label)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, device_id = %device_id, "devices: renommage");
        AppError::Database(e)
    })?
    .rows_affected();
    if affected == 0 {
        return Err(AppError::NotFound("Appareil introuvable".into()));
    }
    Ok(())
}

/// The device a live session belongs to, if any.
pub async fn device_of_session(db: &PgPool, session_id: Uuid) -> Option<Uuid> {
    sqlx::query_scalar::<_, Option<Uuid>>(
        "SELECT device_id FROM core.refresh_tokens WHERE id = $1",
    )
    .bind(session_id)
    .fetch_optional(db)
    .await
    .ok()
    .flatten()
    .flatten()
}
