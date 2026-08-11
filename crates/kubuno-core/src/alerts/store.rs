//! Persistence of the alert centre: raising (with deduplication), reading,
//! and the lifecycle transitions.
//!
//! Every statement targets the `core` schema and nothing else.
//!
//! ## Raising is an upsert, always
//!
//! [`raise`] never asks "have I already said this?". It states the observation
//! and lets the partial unique index decide whether that is a new problem or the
//! same one again. A producer therefore has no memory to keep, no window to
//! track, and no way to write two hundred rows about a module that has been down
//! since Tuesday.

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::{PgConnection, PgPool, Row};
use uuid::Uuid;

use super::catalog;
use super::model::{
    Action, AlertEventRow, AlertRow, AlertSummary, AlertView, EventKind, NewAlert, RaiseOutcome,
    Severity, Status,
};
use crate::authz::AdminContext;
use crate::errors::AppError;

/// Page size ceiling: the queue paints cards on mobile and a dense table on the
/// desktop, and beyond this the payload costs more than it shows.
pub const MAX_LIMIT: i64 = 200;
pub const DEFAULT_LIMIT: i64 = 50;

/// Label recorded on the timeline for work the server did on its own.
pub const SYSTEM_ACTOR: &str = "Système";

const SELECT_COLUMNS: &str = r#"
    a.id, a.source, a.kind, a.severity, a.status, a.title, a.summary, a.payload,
    a.module_id, a.subject_user_id, a.org_unit_id, a.is_simulation,
    a.occurrences, a.first_seen_at, a.last_seen_at,
    a.assignee_id, a.assigned_at, a.closed_at, a.created_at,
    s.username        AS subject_label,
    COALESCE(NULLIF(g.display_name, ''), g.username) AS assignee_label
"#;

/// The clause that quarantines simulation alerts.
///
/// A rule in simulation still raises what it *would* have raised — that is the
/// point of the mode. But those alerts must never reach a badge, a counter or a
/// notification, or "simulation" becomes a synonym for "enabled, loudly". This
/// is applied to every default read; seeing them requires asking for them by
/// name (`?simulation=true` on the queue).
const NOT_SIMULATED: &str = "a.is_simulation = FALSE";

const FROM_JOINS: &str = r#"
    FROM core.alerts a
    LEFT JOIN core.users s ON s.id = a.subject_user_id
    LEFT JOIN core.users g ON g.id = a.assignee_id
"#;

fn map_row(r: &sqlx::postgres::PgRow) -> AlertRow {
    let id: Uuid = r.get("id");
    let kind: String = r.get("kind");
    let payload: Value = r.get("payload");
    let actions = catalog::actions_for(&kind, &payload, id);
    AlertRow {
        id,
        source: r.get("source"),
        kind,
        severity: r.get("severity"),
        status: r.get("status"),
        title: r.get("title"),
        summary: r.get("summary"),
        payload,
        module_id: r.get("module_id"),
        subject_user_id: r.get("subject_user_id"),
        subject_label: r.get("subject_label"),
        org_unit_id: r.get("org_unit_id"),
        is_simulation: r.get("is_simulation"),
        occurrences: r.get("occurrences"),
        first_seen_at: r.get("first_seen_at"),
        last_seen_at: r.get("last_seen_at"),
        assignee_id: r.get("assignee_id"),
        assignee_label: r.get("assignee_label"),
        assigned_at: r.get("assigned_at"),
        closed_at: r.get("closed_at"),
        created_at: r.get("created_at"),
        actions,
    }
}

/// Narrows a row's actions to the ones the caller may actually perform.
///
/// Called on every read. Offering a button the server would refuse tells the
/// operator the console is broken rather than that they lack a privilege.
pub fn visible_actions(ctx: &AdminContext, actions: Vec<Action>) -> Vec<Action> {
    actions.into_iter().filter(|a| ctx.has(&a.privilege)).collect()
}

/// Kinds the caller may **not** read.
///
/// Expressed as a deny-list rather than an allow-list on purpose: a row written
/// by a newer core, whose kind this build does not know, stays visible to anyone
/// holding `core.alerts.read` instead of silently vanishing from the queue.
pub fn denied_kinds(ctx: &AdminContext) -> Vec<String> {
    catalog::ALL_KINDS
        .iter()
        .filter(|k| !ctx.has(catalog::read_privilege(k)))
        .map(|k| (*k).to_string())
        .collect()
}

// ── Raising ──────────────────────────────────────────────────────────────────

/// States an observation, creating the alert or folding it into the existing one.
///
/// The `ON CONFLICT` target is the partial unique index of migration `000056`:
/// it covers every status except `resolved`, so
///
///   * an open or acknowledged alert absorbs the observation (counter up,
///     `last_seen_at` moved, wording refreshed);
///   * an **ignored** alert absorbs it too, silently — that is what the button
///     promised;
///   * a **resolved** alert does not: the problem came back, and a regression
///     hidden inside somebody else's counter is a regression nobody sees.
pub async fn raise(db: &PgPool, alert: NewAlert) -> Result<RaiseOutcome, AppError> {
    let mut tx = db.begin().await.map_err(|e| {
        tracing::error!(error = %e, kind = %alert.kind, "alerts: ouverture de la transaction de levée");
        AppError::Database(e)
    })?;

    // `prev` is read in the same statement as the upsert so the severity the
    // row had *before* this observation is known without a second round trip —
    // it is what decides whether the timeline records an escalation.
    let row = sqlx::query(
        r#"
        WITH prev AS (
            SELECT id, severity FROM core.alerts
             WHERE dedup_key = $10 AND status <> 'resolved'
        ),
        upserted AS (
            INSERT INTO core.alerts
                (source, kind, severity, title, summary, payload,
                 module_id, subject_user_id, org_unit_id, dedup_key, is_simulation)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (dedup_key) WHERE status <> 'resolved'
            DO UPDATE SET
                occurrences  = core.alerts.occurrences + 1,
                last_seen_at = NOW(),
                severity     = EXCLUDED.severity,
                title        = EXCLUDED.title,
                summary      = EXCLUDED.summary,
                payload      = EXCLUDED.payload
            RETURNING id, occurrences, severity, (xmax = 0) AS inserted
        )
        SELECT u.id, u.occurrences, u.severity, u.inserted, p.severity AS prev_severity
          FROM upserted u
          LEFT JOIN prev p ON p.id = u.id
        "#,
    )
    .bind(alert.source)
    .bind(alert.kind)
    .bind(alert.severity.as_str())
    .bind(&alert.title)
    .bind(alert.summary.as_deref())
    .bind(&alert.payload)
    .bind(alert.module_id.as_deref())
    .bind(alert.subject_user_id)
    .bind(alert.org_unit_id)
    .bind(&alert.dedup_key)
    .bind(alert.is_simulation)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, kind = %alert.kind, "alerts: levée d'une alerte");
        AppError::Database(e)
    })?;

    let id: Uuid = row.get("id");
    let occurrences: i32 = row.get("occurrences");
    let created: bool = row.get("inserted");
    let prev_severity: Option<String> = row.get("prev_severity");

    if created {
        // No body: the summary is already the alert's own, rendered in the
        // reader's language two lines above the timeline. Copying the server's
        // English wording here would be the one untranslated sentence on the
        // screen — and a stale one, since the alert's summary is refreshed on
        // every recurrence while a timeline entry never changes.
        record_event(
            &mut tx,
            id,
            EventKind::Created,
            None,
            SYSTEM_ACTOR,
            None,
            Some(alert.severity.as_str()),
            None,
        )
        .await?;
    } else {
        // The recurrence itself. One line per observation would drown the
        // timeline, so it carries the running count instead.
        record_event(
            &mut tx,
            id,
            EventKind::Recurrence,
            None,
            SYSTEM_ACTOR,
            None,
            Some(&occurrences.to_string()),
            None,
        )
        .await?;

        if let Some(before) = prev_severity.as_deref() {
            if before != alert.severity.as_str() {
                record_event(
                    &mut tx,
                    id,
                    EventKind::SeverityChanged,
                    None,
                    SYSTEM_ACTOR,
                    Some(before),
                    Some(alert.severity.as_str()),
                    None,
                )
                .await?;
            }
        }
    }

    tx.commit().await.map_err(|e| {
        tracing::error!(error = %e, kind = %alert.kind, "alerts: commit de la levée");
        AppError::Database(e)
    })?;

    Ok(RaiseOutcome { id, created, occurrences })
}

/// Closes the open alerts of `kind` whose problem is no longer observed.
///
/// `live` is the exhaustive set of dedup keys the producer just saw. Anything
/// open outside it has gone away, and leaving it in the queue would teach the
/// operator that the queue lies. The closure is recorded as a system transition
/// with its reason, never as a silent delete.
///
/// Returns the number of alerts closed.
pub async fn auto_resolve(db: &PgPool, kind: &str, live: &[String]) -> Result<u64, AppError> {
    let mut tx = db.begin().await.map_err(|e| {
        tracing::error!(error = %e, "alerts: ouverture de la transaction de clôture automatique");
        AppError::Database(e)
    })?;

    // Locked before the update so the status recorded on the timeline is the one
    // that was actually replaced, and not a value another transaction moved in
    // between the read and the write.
    let stale: Vec<(Uuid, String)> = sqlx::query_as(
        r#"SELECT id, status FROM core.alerts
            WHERE kind = $1
              AND status IN ('new', 'acknowledged')
              AND dedup_key <> ALL($2)
            FOR UPDATE"#,
    )
    .bind(kind)
    .bind(live)
    .fetch_all(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, kind = %kind, "alerts: recherche des alertes obsolètes");
        AppError::Database(e)
    })?;

    if stale.is_empty() {
        return Ok(0);
    }

    let ids: Vec<Uuid> = stale.iter().map(|(id, _)| *id).collect();

    for (id, previous) in &stale {
        sqlx::query("UPDATE core.alerts SET status = 'resolved', closed_at = NOW() WHERE id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, alert_id = %id, "alerts: clôture automatique");
                AppError::Database(e)
            })?;

        record_event(
            &mut tx,
            *id,
            EventKind::StatusChanged,
            None,
            SYSTEM_ACTOR,
            Some(previous),
            Some(Status::Resolved.as_str()),
            Some("La condition n'est plus observée."),
        )
        .await?;
    }

    tx.commit().await.map_err(|e| {
        tracing::error!(error = %e, "alerts: commit de la clôture automatique");
        AppError::Database(e)
    })?;

    tracing::info!(kind = %kind, closed = ids.len(), "Alertes closes automatiquement");
    Ok(ids.len() as u64)
}

// ── Timeline ─────────────────────────────────────────────────────────────────

/// Appends one line to an alert's history.
///
/// Takes a connection rather than a pool so a transition and its timeline entry
/// land in the same commit as the mutation — the same discipline as
/// [`crate::audit::AuditTx`], for the same reason.
#[allow(clippy::too_many_arguments)]
pub async fn record_event(
    conn: &mut PgConnection,
    alert_id: Uuid,
    kind: EventKind,
    actor_id: Option<Uuid>,
    actor_label: &str,
    from_value: Option<&str>,
    to_value: Option<&str>,
    body: Option<&str>,
) -> Result<(), AppError> {
    sqlx::query(
        r#"INSERT INTO core.alert_events
               (alert_id, kind, actor_id, actor_label, from_value, to_value, body)
           VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
    )
    .bind(alert_id)
    .bind(kind.as_str())
    .bind(actor_id)
    .bind(actor_label)
    .bind(from_value)
    .bind(to_value)
    .bind(body)
    .execute(conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, alert_id = %alert_id, "alerts: écriture d'un événement de fil");
        AppError::Database(e)
    })?;
    Ok(())
}

pub async fn timeline(db: &PgPool, alert_id: Uuid) -> Result<Vec<AlertEventRow>, AppError> {
    let rows = sqlx::query(
        r#"SELECT id, kind, actor_id, actor_label, from_value, to_value, body, occurred_at
             FROM core.alert_events
            WHERE alert_id = $1
            ORDER BY occurred_at ASC, id ASC
            LIMIT 500"#,
    )
    .bind(alert_id)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, alert_id = %alert_id, "alerts: lecture du fil chronologique");
        AppError::Database(e)
    })?;

    Ok(rows
        .iter()
        .map(|r| AlertEventRow {
            id: r.get("id"),
            kind: r.get("kind"),
            actor_id: r.get("actor_id"),
            actor_label: r.get("actor_label"),
            from_value: r.get("from_value"),
            to_value: r.get("to_value"),
            body: r.get("body"),
            occurred_at: r.get("occurred_at"),
        })
        .collect())
}

// ── Reading ──────────────────────────────────────────────────────────────────

/// Filters of `GET /admin/alerts`. Every field is optional; an absent one means
/// "no restriction", never "match nothing".
#[derive(Debug, Default, Clone, serde::Deserialize)]
pub struct AlertQuery {
    /// Comma-separated statuses. Absent means the open queue (`new`,
    /// `acknowledged`) — the state an operator actually wants on arrival.
    pub status: Option<String>,
    pub severity: Option<String>,
    pub kind: Option<String>,
    pub source: Option<String>,
    pub module_id: Option<String>,
    /// `me` resolves to the caller; a uuid to that account; `none` to unassigned.
    pub assignee: Option<String>,
    /// The account an alert is about.
    pub subject_user_id: Option<Uuid>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    /// Free text over title, summary and kind.
    pub q: Option<String>,
    pub limit: Option<i64>,
    /// Offset-free position: `<rfc3339>|<uuid>` of the last row returned.
    pub cursor: Option<String>,
    /// Show what rules in **simulation** would have raised, instead of the real
    /// queue. Absent means the real queue: simulated alerts are opt-in by name,
    /// never mixed in and never merely filtered out by a default the console
    /// could forget to send.
    pub simulation: Option<bool>,
}

fn split_csv(raw: Option<&String>) -> Option<Vec<String>> {
    let value = raw?.trim();
    if value.is_empty() {
        return None;
    }
    let parts: Vec<String> = value
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .collect();
    (!parts.is_empty()).then_some(parts)
}

/// Opaque position in the descending `(last_seen_at, id)` ordering.
pub fn encode_cursor(at: DateTime<Utc>, id: Uuid) -> String {
    use base64::Engine as _;
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(format!("{}|{id}", at.to_rfc3339()))
}

fn decode_cursor(raw: &str) -> Option<(DateTime<Utc>, Uuid)> {
    use base64::Engine as _;
    let bytes = base64::engine::general_purpose::URL_SAFE_NO_PAD
        .decode(raw.trim())
        .ok()?;
    let text = String::from_utf8(bytes).ok()?;
    let (at, id) = text.rsplit_once('|')?;
    Some((
        DateTime::parse_from_rfc3339(at).ok()?.with_timezone(&Utc),
        Uuid::parse_str(id).ok()?,
    ))
}

pub struct Page {
    pub rows: Vec<AlertRow>,
    pub next_cursor: Option<String>,
}

/// One page of the queue, worst-and-newest first, narrowed to what the caller
/// may read.
pub async fn list(db: &PgPool, q: &AlertQuery, ctx: &AdminContext) -> Result<Page, AppError> {
    let limit = q.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
    let cursor = q.cursor.as_deref().and_then(decode_cursor);

    // Default view: the work still to do. Asking for everything is explicit.
    let statuses = split_csv(q.status.as_ref())
        .unwrap_or_else(|| vec![Status::New.as_str().into(), Status::Acknowledged.as_str().into()]);
    let severities = split_csv(q.severity.as_ref());
    let kinds = split_csv(q.kind.as_ref());
    let denied = denied_kinds(ctx);

    // `me` / `none` are resolved here rather than in the query string, so a
    // saved filter set stays meaningful when another operator opens it.
    let (assignee_id, unassigned_only) = match q.assignee.as_deref().map(str::trim) {
        Some("me") => (Some(ctx.user_id), false),
        Some("none") => (None, true),
        Some(raw) if !raw.is_empty() => (Uuid::parse_str(raw).ok(), false),
        _ => (None, false),
    };

    let sql = format!(
        r#"SELECT {SELECT_COLUMNS} {FROM_JOINS}
           WHERE a.status = ANY($1)
             AND ($2::text[] IS NULL OR a.severity = ANY($2))
             AND ($3::text[] IS NULL OR a.kind     = ANY($3))
             AND a.kind <> ALL($4)
             AND ($5::text IS NULL OR a.source    = $5)
             AND ($6::text IS NULL OR a.module_id = $6)
             AND ($7::uuid IS NULL OR a.assignee_id = $7)
             AND (NOT $8::bool OR a.assignee_id IS NULL)
             AND ($9::uuid IS NULL OR a.subject_user_id = $9)
             AND ($10::timestamptz IS NULL OR a.last_seen_at >= $10)
             AND ($11::timestamptz IS NULL OR a.last_seen_at <= $11)
             AND ($12::text IS NULL OR a.title ILIKE '%' || $12 || '%'
                                    OR a.summary ILIKE '%' || $12 || '%'
                                    OR a.kind ILIKE '%' || $12 || '%')
             AND ($13::timestamptz IS NULL OR (a.last_seen_at, a.id) < ($13, $14))
             AND a.is_simulation = $16
           ORDER BY a.last_seen_at DESC, a.id DESC
           LIMIT $15"#
    );

    // One extra row answers "is there a next page?" without a COUNT.
    let rows = sqlx::query(&sql)
        .bind(&statuses)
        .bind(severities.as_deref())
        .bind(kinds.as_deref())
        .bind(&denied)
        .bind(q.source.as_deref().filter(|s| !s.is_empty()))
        .bind(q.module_id.as_deref().filter(|s| !s.is_empty()))
        .bind(assignee_id)
        .bind(unassigned_only)
        .bind(q.subject_user_id)
        .bind(q.from)
        .bind(q.to)
        .bind(q.q.as_deref().filter(|s| !s.is_empty()))
        .bind(cursor.map(|(at, _)| at))
        .bind(cursor.map(|(_, id)| id))
        .bind(limit + 1)
        .bind(q.simulation.unwrap_or(false))
        .fetch_all(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "alerts: lecture de la file");
            AppError::Database(e)
        })?;

    let has_more = rows.len() as i64 > limit;
    let mut out: Vec<AlertRow> = rows
        .iter()
        .take(limit as usize)
        .map(|r| {
            let mut row = map_row(r);
            row.actions = visible_actions(ctx, std::mem::take(&mut row.actions));
            row
        })
        .collect();

    let next_cursor = has_more
        .then(|| out.last().map(|r| encode_cursor(r.last_seen_at, r.id)))
        .flatten();

    // Nothing else touches `out` after this; the binding keeps the intent clear.
    out.shrink_to_fit();
    Ok(Page { rows: out, next_cursor })
}

/// One alert. Refuses a kind the caller may not read, exactly like the list.
pub async fn get(db: &PgPool, id: Uuid, ctx: &AdminContext) -> Result<AlertRow, AppError> {
    let sql = format!("SELECT {SELECT_COLUMNS} {FROM_JOINS} WHERE a.id = $1");
    let row = sqlx::query(&sql)
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, alert_id = %id, "alerts: lecture d'une alerte");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Alerte introuvable".into()))?;

    let mut alert = map_row(&row);
    if !ctx.has(catalog::read_privilege(&alert.kind)) {
        tracing::warn!(
            user_id = %ctx.user_id, kind = %alert.kind,
            "alerts: type d'alerte hors du périmètre de l'appelant"
        );
        return Err(AppError::Forbidden);
    }
    alert.actions = visible_actions(ctx, alert.actions);
    Ok(alert)
}

/// Alerts that share the same problem space: same kind, or same account.
///
/// The point is the question an operator asks after opening one alert — "is this
/// the only one?" — answered without going back to the queue and re-filtering.
pub async fn related(db: &PgPool, alert: &AlertRow, ctx: &AdminContext) -> Result<Vec<AlertRow>, AppError> {
    let denied = denied_kinds(ctx);
    let sql = format!(
        r#"SELECT {SELECT_COLUMNS} {FROM_JOINS}
           WHERE a.id <> $1
             AND a.kind <> ALL($4)
             AND {NOT_SIMULATED}
             AND (a.kind = $2 OR ($3::uuid IS NOT NULL AND a.subject_user_id = $3))
           ORDER BY a.last_seen_at DESC
           LIMIT 10"#
    );
    let rows = sqlx::query(&sql)
        .bind(alert.id)
        .bind(&alert.kind)
        .bind(alert.subject_user_id)
        .bind(&denied)
        .fetch_all(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, alert_id = %alert.id, "alerts: lecture des alertes liées");
            AppError::Database(e)
        })?;
    Ok(rows.iter().map(map_row).collect())
}

/// Counts for the badges, and when the producers last ran.
pub async fn summary(db: &PgPool, ctx: &AdminContext) -> Result<AlertSummary, AppError> {
    let denied = denied_kinds(ctx);
    let row = sqlx::query(
        r#"SELECT
             COUNT(*) FILTER (WHERE status IN ('new','acknowledged'))                    AS open,
             COUNT(*) FILTER (WHERE status = 'new')                                      AS fresh,
             COUNT(*) FILTER (WHERE status = 'acknowledged')                             AS acknowledged,
             COUNT(*) FILTER (WHERE status IN ('new','acknowledged') AND severity = 'critical') AS critical,
             COUNT(*) FILTER (WHERE status IN ('new','acknowledged') AND severity = 'warning')  AS warning,
             COUNT(*) FILTER (WHERE status IN ('new','acknowledged') AND severity = 'info')     AS info,
             COUNT(*) FILTER (WHERE status = 'ignored')                                  AS ignored,
             COUNT(*) FILTER (WHERE status = 'resolved')                                 AS resolved,
             COUNT(*) FILTER (WHERE status IN ('new','acknowledged') AND assignee_id = $2) AS mine
           FROM core.alerts
          WHERE kind <> ALL($1)
            -- Simulated alerts are never counted. The badge over the bell is
            -- exactly the place where a "what if" must not look like a fact.
            AND is_simulation = FALSE"#,
    )
    .bind(&denied)
    .bind(ctx.user_id)
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: comptage du résumé");
        AppError::Database(e)
    })?;

    Ok(AlertSummary {
        open: row.get("open"),
        new: row.get("fresh"),
        acknowledged: row.get("acknowledged"),
        critical: row.get("critical"),
        warning: row.get("warning"),
        info: row.get("info"),
        ignored: row.get("ignored"),
        resolved: row.get("resolved"),
        mine: row.get("mine"),
        last_scan_at: super::producers::last_scan_at(db).await?,
    })
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

/// Applies a status transition inside an already-open transaction.
///
/// Returns the previous status so the caller can put it in the audit entry —
/// "who closed this, and what it was before" is the pair that makes the trail
/// worth keeping.
pub async fn set_status(
    conn: &mut PgConnection,
    alert_id: Uuid,
    next: Status,
    actor_id: Uuid,
    actor_label: &str,
    note: Option<&str>,
) -> Result<Status, AppError> {
    let current: String = sqlx::query_scalar("SELECT status FROM core.alerts WHERE id = $1 FOR UPDATE")
        .bind(alert_id)
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, alert_id = %alert_id, "alerts: lecture de l'état courant");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Alerte introuvable".into()))?;

    let previous = Status::parse(&current)
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("État d'alerte inconnu : {current}")))?;

    if !previous.may_move_to(next) {
        return Err(AppError::Validation(
            "L'alerte est déjà dans cet état".into(),
        ));
    }

    sqlx::query(
        r#"UPDATE core.alerts
              SET status    = $2,
                  closed_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
                  closed_by = CASE WHEN $3 THEN $4::uuid ELSE NULL END
            WHERE id = $1"#,
    )
    .bind(alert_id)
    .bind(next.as_str())
    .bind(next.is_closed())
    .bind(actor_id)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, alert_id = %alert_id, "alerts: changement d'état");
        AppError::Database(e)
    })?;

    record_event(
        conn,
        alert_id,
        EventKind::StatusChanged,
        Some(actor_id),
        actor_label,
        Some(previous.as_str()),
        Some(next.as_str()),
        note,
    )
    .await?;

    Ok(previous)
}

/// Assigns the alert, or clears the assignment when `assignee` is `None`.
///
/// The caller is responsible for having checked that the account may read the
/// alert centre ([`eligible_assignee`]): assigning work to somebody who cannot
/// open it is how an alert sits untouched for a week.
pub async fn set_assignee(
    conn: &mut PgConnection,
    alert_id: Uuid,
    assignee: Option<(Uuid, String)>,
    actor_id: Uuid,
    actor_label: &str,
) -> Result<Option<String>, AppError> {
    let previous: Option<String> = sqlx::query_scalar(
        r#"SELECT COALESCE(NULLIF(u.display_name, ''), u.username)
             FROM core.alerts a LEFT JOIN core.users u ON u.id = a.assignee_id
            WHERE a.id = $1"#,
    )
    .bind(alert_id)
    .fetch_optional(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, alert_id = %alert_id, "alerts: lecture de l'assigné courant");
        AppError::Database(e)
    })?
    .ok_or_else(|| AppError::NotFound("Alerte introuvable".into()))?;

    sqlx::query(
        r#"UPDATE core.alerts
              SET assignee_id = $2,
                  assigned_at = CASE WHEN $2::uuid IS NULL THEN NULL ELSE NOW() END
            WHERE id = $1"#,
    )
    .bind(alert_id)
    .bind(assignee.as_ref().map(|(id, _)| *id))
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, alert_id = %alert_id, "alerts: assignation");
        AppError::Database(e)
    })?;

    record_event(
        conn,
        alert_id,
        EventKind::Assigned,
        Some(actor_id),
        actor_label,
        previous.as_deref(),
        assignee.as_ref().map(|(_, label)| label.as_str()),
        None,
    )
    .await?;

    Ok(previous)
}

/// Appends a free comment to the timeline.
pub async fn add_comment(
    conn: &mut PgConnection,
    alert_id: Uuid,
    body: &str,
    actor_id: Uuid,
    actor_label: &str,
) -> Result<(), AppError> {
    let exists: Option<Uuid> = sqlx::query_scalar("SELECT id FROM core.alerts WHERE id = $1")
        .bind(alert_id)
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, alert_id = %alert_id, "alerts: vérification de l'alerte commentée");
            AppError::Database(e)
        })?;
    if exists.is_none() {
        return Err(AppError::NotFound("Alerte introuvable".into()));
    }

    record_event(
        conn,
        alert_id,
        EventKind::Comment,
        Some(actor_id),
        actor_label,
        None,
        None,
        Some(body),
    )
    .await
}

/// Accounts that may be handed an alert: those holding `core.alerts.read`,
/// directly or through a group, with a live assignment. Super-users are
/// included by the marker join.
///
/// Reusing the same resolution rules as [`crate::authz::context::resolve`]
/// rather than a second, looser query: an eligibility list that is broader than
/// the actual privilege check would offer names the assignment then refuses.
pub async fn eligible_assignees(db: &PgPool) -> Result<Vec<(Uuid, String)>, AppError> {
    let rows = sqlx::query(
        r#"
        WITH live AS (
            SELECT a.role_id,
                   COALESCE(a.subject_user_id, m.user_id) AS user_id
              FROM core.role_assignments a
              LEFT JOIN core.user_group_members m ON m.group_id = a.subject_group_id
             WHERE (a.expires_at IS NULL OR a.expires_at > NOW())
        )
        SELECT DISTINCT u.id, COALESCE(NULLIF(u.display_name, ''), u.username) AS label
          FROM live
          JOIN core.users u ON u.id = live.user_id AND u.is_active
          JOIN core.roles r ON r.id = live.role_id
         WHERE r.is_superuser
            OR EXISTS (
                SELECT 1 FROM core.role_privileges rp
                 WHERE rp.role_id = live.role_id AND rp.privilege_key = $1
            )
         ORDER BY label
         LIMIT 500
        "#,
    )
    .bind(super::keys::ALERTS_READ)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: liste des assignés éligibles");
        AppError::Database(e)
    })?;

    Ok(rows.iter().map(|r| (r.get("id"), r.get("label"))).collect())
}

/// Is this account allowed to be handed an alert? Returns its display label.
pub async fn eligible_assignee(db: &PgPool, user_id: Uuid) -> Result<String, AppError> {
    eligible_assignees(db)
        .await?
        .into_iter()
        .find(|(id, _)| *id == user_id)
        .map(|(_, label)| label)
        .ok_or_else(|| {
            tracing::warn!(user_id = %user_id, "alerts: assignation à un compte sans accès au centre d'alertes");
            AppError::Validation(
                "Ce compte n'a pas accès au centre d'alertes : il ne peut pas se voir assigner une alerte".into(),
            )
        })
}

// ── Saved filter sets ────────────────────────────────────────────────────────

pub async fn list_views(db: &PgPool, owner: Uuid) -> Result<Vec<AlertView>, AppError> {
    let rows = sqlx::query(
        "SELECT id, name, filters, created_at FROM core.alert_views WHERE owner_id = $1 ORDER BY name",
    )
    .bind(owner)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: lecture des jeux de filtres");
        AppError::Database(e)
    })?;

    Ok(rows
        .iter()
        .map(|r| AlertView {
            id: r.get("id"),
            name: r.get("name"),
            filters: r.get("filters"),
            created_at: r.get("created_at"),
        })
        .collect())
}

/// Creates or replaces a saved filter set. Upsert on `(owner, name)`: saving
/// twice under the same name overwrites rather than failing on the constraint.
pub async fn save_view(
    db: &PgPool,
    owner: Uuid,
    name: &str,
    filters: &Value,
) -> Result<AlertView, AppError> {
    let name = name.trim();
    if name.is_empty() {
        return Err(AppError::Validation("Le nom du filtre est vide".into()));
    }
    if name.chars().count() > 120 {
        return Err(AppError::Validation("Le nom du filtre est trop long".into()));
    }
    if !filters.is_object() {
        return Err(AppError::Validation("Filtre invalide".into()));
    }

    let row = sqlx::query(
        r#"INSERT INTO core.alert_views (owner_id, name, filters)
           VALUES ($1, $2, $3)
           ON CONFLICT (owner_id, name) DO UPDATE SET filters = EXCLUDED.filters
           RETURNING id, name, filters, created_at"#,
    )
    .bind(owner)
    .bind(name)
    .bind(filters)
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: enregistrement d'un jeu de filtres");
        AppError::Database(e)
    })?;

    Ok(AlertView {
        id: row.get("id"),
        name: row.get("name"),
        filters: row.get("filters"),
        created_at: row.get("created_at"),
    })
}

pub async fn delete_view(db: &PgPool, owner: Uuid, id: Uuid) -> Result<(), AppError> {
    let affected = sqlx::query("DELETE FROM core.alert_views WHERE id = $1 AND owner_id = $2")
        .bind(id)
        .bind(owner)
        .execute(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "alerts: suppression d'un jeu de filtres");
            AppError::Database(e)
        })?
        .rows_affected();
    if affected == 0 {
        return Err(AppError::NotFound("Filtre introuvable".into()));
    }
    Ok(())
}

/// Distinct values present in the table, for the filter selects.
///
/// Bounded by construction (a handful of kinds, one row per module), so this
/// stays cheap and never hard-codes a catalogue that drifts.
pub async fn facets(db: &PgPool, ctx: &AdminContext) -> Result<(Vec<String>, Vec<String>), AppError> {
    let denied = denied_kinds(ctx);
    let kinds: Vec<String> = sqlx::query_scalar(
        "SELECT DISTINCT kind FROM core.alerts
          WHERE kind <> ALL($1) AND is_simulation = FALSE ORDER BY kind LIMIT 100",
    )
    .bind(&denied)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: facettes (types)");
        AppError::Database(e)
    })?;

    let sources: Vec<String> = sqlx::query_scalar(
        "SELECT DISTINCT source FROM core.alerts
          WHERE kind <> ALL($1) AND is_simulation = FALSE ORDER BY source LIMIT 50",
    )
    .bind(&denied)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: facettes (sources)");
        AppError::Database(e)
    })?;

    Ok((kinds, sources))
}

/// Purges closed alerts older than the configured window, with their history
/// (the `ON DELETE CASCADE` on `core.alert_events` does the second half).
///
/// Open alerts are never purged, whatever their age: an alert that has been open
/// for a year is the most important row in the table, not the stalest.
pub async fn purge_closed(db: &PgPool, retention_days: i64) -> Result<u64, AppError> {
    let days = retention_days.clamp(7, 3_650);
    let deleted = sqlx::query(
        r#"DELETE FROM core.alerts
            WHERE status IN ('resolved', 'ignored')
              AND closed_at < NOW() - ($1 || ' days')::interval"#,
    )
    .bind(days.to_string())
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: purge des alertes closes");
        AppError::Database(e)
    })?
    .rows_affected();
    Ok(deleted)
}

/// Severity of an alert, read back for the audit entry of a transition.
pub async fn severity_of(db: &PgPool, id: Uuid) -> Result<Severity, AppError> {
    let raw: String = sqlx::query_scalar("SELECT severity FROM core.alerts WHERE id = $1")
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, alert_id = %id, "alerts: lecture de la gravité");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Alerte introuvable".into()))?;
    Severity::parse(&raw)
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Gravité d'alerte inconnue : {raw}")))
}
