//! The producers: the only things that write alerts.
//!
//! ## What is in here, and what is deliberately not
//!
//! Every producer below observes something the core **already records today**.
//! Nothing is invented, nothing depends on a collector that does not exist: a
//! producer that cannot be triggered is a feature that cannot be trusted.
//!
//! Two shapes, and the difference governs auto-closure:
//!
//! * **State producers** describe a condition that is either true or false right
//!   now — a module that is not answering, a volume with 4 % left, a health
//!   check that is failing, a job type that has given up. They publish the
//!   exhaustive set of live problems, and [`store::auto_resolve`] closes the
//!   alerts that are no longer in it. Without that, the queue accumulates
//!   findings that were fixed weeks ago and stops being read.
//!
//! * **Event producers** describe something that *happened* — a privilege was
//!   granted, a sensitive setting was changed. These never auto-close: the event
//!   does not stop having happened, and only a human can say "yes, that was me".
//!
//! ## Never a credential
//!
//! A producer reads verdicts and counts. `security.sensitive_setting` records
//! *which* key changed and *who* changed it, never the value — the audit trail
//! already redacts snapshots, and copying a redacted value here would be one
//! more place to get it wrong.

use std::collections::HashMap;
use std::path::Path;

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use super::catalog;
use super::model::{NewAlert, Severity};
use super::store;
use crate::config::Settings;
use crate::errors::AppError;
use crate::health::{self, disk, RequestProbe, Status as HealthStatus};

/// Settings that tune the producers, with the defaults they fall back to when
/// the row is missing (a partially migrated database must still be observed).
#[derive(Debug, Clone)]
pub struct Thresholds {
    pub enabled: bool,
    pub login_burst: i64,
    pub login_window_min: i64,
    pub disk_warn_percent: i64,
    pub disk_critical_percent: i64,
    /// Fill ratio of an account's own quota past which it becomes a piece of
    /// work. Shared with the storage page, so the colour on screen and the alert
    /// in the queue cannot draw the line in two different places.
    pub quota_percent: i64,
    pub retention_days: i64,
}

impl Default for Thresholds {
    fn default() -> Self {
        Self {
            enabled: true,
            login_burst: 5,
            login_window_min: 15,
            disk_warn_percent: 15,
            disk_critical_percent: 7,
            quota_percent: 90,
            retention_days: 180,
        }
    }
}

const SETTING_KEYS: &[&str] = &[
    "alerts.enabled",
    "alerts.login_burst_threshold",
    "alerts.login_burst_window_min",
    "alerts.disk_warn_percent",
    "alerts.disk_critical_percent",
    "alerts.quota_percent",
    "alerts.retention_days",
];

pub async fn thresholds(db: &PgPool) -> Result<Thresholds, AppError> {
    let rows = sqlx::query("SELECT key, value FROM core.settings WHERE key = ANY($1)")
        .bind(SETTING_KEYS)
        .fetch_all(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "alerts: lecture des seuils");
            AppError::Database(e)
        })?;

    let map: HashMap<String, Value> = rows
        .iter()
        .map(|r| (r.get::<String, _>("key"), r.get::<Value, _>("value")))
        .collect();

    let d = Thresholds::default();
    let int = |key: &str, fallback: i64| -> i64 {
        map.get(key).and_then(Value::as_i64).unwrap_or(fallback)
    };

    Ok(Thresholds {
        enabled: map
            .get("alerts.enabled")
            .and_then(Value::as_bool)
            .unwrap_or(d.enabled),
        // Clamped rather than trusted: a threshold of 0 would open an alert on
        // every single failed sign-in, which is how an operator learns to mute
        // the whole feature.
        login_burst: int("alerts.login_burst_threshold", d.login_burst).clamp(2, 10_000),
        login_window_min: int("alerts.login_burst_window_min", d.login_window_min).clamp(1, 1_440),
        disk_warn_percent: int("alerts.disk_warn_percent", d.disk_warn_percent).clamp(1, 90),
        disk_critical_percent: int("alerts.disk_critical_percent", d.disk_critical_percent)
            .clamp(1, 90),
        // Below 50 % the alert stops describing an account that is nearly full
        // and starts describing an account that is being used at all.
        quota_percent: int("alerts.quota_percent", d.quota_percent).clamp(50, 100),
        retention_days: int("alerts.retention_days", d.retention_days).clamp(7, 3_650),
    })
}

/// What one pass did, for the log line and for the manual "analyse now" button.
#[derive(Debug, Clone, Default, serde::Serialize)]
pub struct ScanReport {
    pub raised: usize,
    pub recurring: usize,
    pub auto_resolved: u64,
    pub purged: u64,
}

impl ScanReport {
    fn note(&mut self, outcome: super::model::RaiseOutcome) {
        if outcome.created {
            self.raised += 1;
        } else {
            self.recurring += 1;
        }
    }
}

/// Runs every producer once.
///
/// Failures are per-producer: one detector unable to read its table must not
/// take the other five down with it, because the ones still working are exactly
/// what an operator needs when something is already wrong. Each error is logged
/// where it happens.
pub async fn run_all(db: &PgPool, settings: &Settings) -> Result<ScanReport, AppError> {
    let cfg = thresholds(db).await?;
    let mut report = ScanReport::default();

    if !cfg.enabled {
        tracing::info!("Centre d'alertes désactivé : analyse ignorée");
        return Ok(report);
    }

    if let Err(e) = health_criticals(db, settings, &mut report).await {
        tracing::error!(error = %e, "alerts: producteur « contrôles de santé »");
    }
    if let Err(e) = failing_modules(db, &mut report).await {
        tracing::error!(error = %e, "alerts: producteur « modules indisponibles »");
    }
    if let Err(e) = dead_letter_jobs(db, &mut report).await {
        tracing::error!(error = %e, "alerts: producteur « tâches en échec définitif »");
    }
    if let Err(e) = backup_failures(db, &mut report).await {
        tracing::error!(error = %e, "alerts: producteur « sauvegarde en échec »");
    }
    if let Err(e) = login_bursts(db, &cfg, &mut report).await {
        tracing::error!(error = %e, "alerts: producteur « rafales d'échecs de connexion »");
    }
    if let Err(e) = privilege_grants(db, &mut report).await {
        tracing::error!(error = %e, "alerts: producteur « privilèges accordés »");
    }
    if let Err(e) = sensitive_settings(db, &mut report).await {
        tracing::error!(error = %e, "alerts: producteur « réglages sensibles modifiés »");
    }
    if let Err(e) = disk_pressure(db, settings, &cfg, &mut report).await {
        tracing::error!(error = %e, "alerts: producteur « espace disque »");
    }
    if let Err(e) = quota_pressure(db, &cfg, &mut report).await {
        tracing::error!(error = %e, "alerts: producteur « comptes saturés »");
    }

    // The storage trend is sampled from the same pass rather than from a job of
    // its own: the producers already read the account table every few minutes,
    // and a second recurring job to read it again would be one more thing to
    // supervise for one more row per day. A failure here never stops the scan —
    // a missing point on a curve is not worth losing an alert over.
    if let Err(e) = crate::storage::samples::capture(db).await {
        tracing::error!(error = %e, "alerts: échantillon de stockage");
    }

    match store::purge_closed(db, cfg.retention_days).await {
        Ok(n) => report.purged = n,
        Err(_) => { /* already logged */ }
    }

    tracing::info!(
        ouvertes = report.raised,
        récurrentes = report.recurring,
        closes = report.auto_resolved,
        purgées = report.purged,
        "Analyse du centre d'alertes terminée"
    );
    Ok(report)
}

/// When the producers last completed a pass.
///
/// Read from the job table rather than kept in a setting: the scan *is* a job,
/// and asking the queue is the only answer that cannot drift from reality. The
/// console shows it next to "no alert", because "nothing to report" and "nothing
/// has looked" are not the same sentence.
pub async fn last_scan_at(db: &PgPool) -> Result<Option<DateTime<Utc>>, AppError> {
    sqlx::query_scalar("SELECT MAX(done_at) FROM core.jobs WHERE job_type = $1 AND status = 'done'")
        .bind(super::jobs::SCAN)
        .fetch_one(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "alerts: lecture de la date de dernière analyse");
            AppError::Database(e)
        })
}

// ── State producers ──────────────────────────────────────────────────────────

/// Health checks that are failing at `critical`.
///
/// Only `critical`: the health page already lists warnings, in context, next to
/// the ones that pass. Promoting all of them here would turn the queue into a
/// second copy of that page — and a queue that repeats another screen is one an
/// operator stops opening.
///
/// The alert reuses the check's **own** action rather than deriving one, so the
/// two features can never disagree about where a finding is fixed.
/// Health checks whose verdict is an **observation of this process**, not a
/// stable fact about the instance.
///
/// `exposure.https` is the only one: nothing in the configuration says whether
/// TLS terminates upstream, so the check learns it from the requests the process
/// has served (`health::facts::note_probe`). A freshly restarted server has
/// therefore seen no evidence and reports "unencrypted" until the first request
/// arrives through the proxy — which would open an alert at every restart and
/// close it ninety seconds later.
///
/// The health page keeps reporting it, in context, where that caveat is part of
/// the reading. A queue cannot: an alert that appears and vanishes on its own is
/// how an operator learns the queue is not worth believing.
const PROBE_DEPENDENT: &[&str] = &["exposure.https"];

async fn health_criticals(
    db: &PgPool,
    settings: &Settings,
    report: &mut ScanReport,
) -> Result<(), AppError> {
    // `RequestProbe::default()` says "this observation learned nothing new about
    // how the instance is reached". `facts::note_probe` accumulates what real
    // requests taught the process, so a scan never *unlearns* that the instance
    // is served over TLS.
    let (checks, _, _) = health::evaluate(db, settings, RequestProbe::default(), false).await?;

    let mut live = Vec::new();
    for check in checks.iter().filter(|c| {
        c.severity == health::Severity::Critical
            && c.status.is_failing()
            && !PROBE_DEPENDENT.contains(&c.id)
    }) {
        let payload = json!({
            "check_id":      check.id,
            "block":         check.block.as_str(),
            "why":           check.why,
            "status":        check.status.as_str(),
            "value_key":     check.value.key,
            "value_args":    check.value.args,
            "value_summary": check.value.summary,
            "action_tab":    check.action.as_ref().map(|a| a.tab),
            "action_verb":   check.action.as_ref().and_then(|a| a.verb),
            "action_label":  check.action.as_ref().map(|a| a.label),
            // `blocked` means the console cannot fix it at all; saying so in the
            // alert is more honest than offering a button that leads nowhere.
            "blocked":       check.status == HealthStatus::Blocked,
        });

        let alert = NewAlert::new(
            catalog::HEALTH_CRITICAL,
            catalog::SRC_HEALTH,
            Severity::Critical,
            check.title,
        )
        .summary(check.why)
        .payload(payload)
        .dedup(check.id);

        live.push(alert.dedup_key.clone());
        report.note(store::raise(db, alert).await?);
    }

    report.auto_resolved += store::auto_resolve(db, catalog::HEALTH_CRITICAL, &live).await?;
    Ok(())
}

/// Enabled modules that are not answering.
///
/// Same query as the health report's own module check, on purpose: one reading
/// of `core.module_instances`, so the banner and the queue never disagree about
/// whether Drive is up.
async fn failing_modules(db: &PgPool, report: &mut ScanReport) -> Result<(), AppError> {
    let rows = sqlx::query(
        r#"SELECT m.id AS id,
                  m.display_name AS display_name,
                  COALESCE(mi.status, 'never_registered') AS status,
                  mi.last_heartbeat AS last_heartbeat
             FROM core.modules m
             LEFT JOIN LATERAL (
                 SELECT status, last_heartbeat
                   FROM core.module_instances
                  WHERE module_id = m.id
                  ORDER BY registered_at DESC
                  LIMIT 1
             ) mi ON TRUE
            WHERE m.is_enabled = TRUE
              AND m.is_core_module = FALSE
              AND (mi.status IS NULL OR mi.status IN ('degraded', 'stopped'))
            ORDER BY m.id"#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: lecture des modules en échec");
        AppError::Database(e)
    })?;

    let mut live = Vec::new();
    for row in &rows {
        let id: String = row.get("id");
        let name: String = row.get("display_name");
        let status: String = row.get("status");
        let heartbeat: Option<DateTime<Utc>> = row.get("last_heartbeat");

        let alert = NewAlert::new(
            catalog::MODULE_UNAVAILABLE,
            catalog::SRC_MODULES,
            Severity::Critical,
            format!("The module “{name}” is not answering"),
        )
        .summary(format!(
            "It is enabled but its instance reports “{status}”. Everything it serves is unavailable."
        ))
        .payload(json!({
            "module_id":      id,
            "module_name":    name,
            "status":         status,
            "last_heartbeat": heartbeat,
        }))
        .module(&id)
        .dedup(&id);

        live.push(alert.dedup_key.clone());
        report.note(store::raise(db, alert).await?);
    }

    report.auto_resolved += store::auto_resolve(db, catalog::MODULE_UNAVAILABLE, &live).await?;
    Ok(())
}

/// Background job types that exhausted their attempts.
///
/// Grouped **by type**, not by row: two hundred failures of `core.send_email`
/// are one problem with one fix, and two hundred alerts about it would be the
/// exact failure mode this feature exists to avoid. The count travels in the
/// payload; the deduplication counter says how many passes have seen it.
async fn dead_letter_jobs(db: &PgPool, report: &mut ScanReport) -> Result<(), AppError> {
    let rows = sqlx::query(
        r#"SELECT job_type,
                  COUNT(*)                                            AS failures,
                  MAX(done_at)                                        AS last_failure,
                  (array_agg(error ORDER BY done_at DESC NULLS LAST))[1] AS last_error,
                  (array_agg(module_id ORDER BY done_at DESC NULLS LAST))[1] AS module_id
             FROM core.jobs
            WHERE status = 'failed'
            GROUP BY job_type
            ORDER BY job_type"#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: lecture des tâches en échec définitif");
        AppError::Database(e)
    })?;

    let mut live = Vec::new();
    for row in &rows {
        let job_type: String = row.get("job_type");
        let failures: i64 = row.get("failures");
        let last_error: Option<String> = row.get("last_error");
        let module_id: Option<String> = row.get("module_id");
        let last_failure: Option<DateTime<Utc>> = row.get("last_failure");

        // A single give-up is worth knowing about; a pile of them means the work
        // is not getting done at all.
        let severity = if failures >= 20 { Severity::Critical } else { Severity::Warning };

        let mut alert = NewAlert::new(
            catalog::JOB_DEAD_LETTER,
            catalog::SRC_JOBS,
            severity,
            format!("Background work “{job_type}” has given up"),
        )
        .summary(format!(
            "{failures} job(s) of this type exhausted their attempts and will not run again on their own."
        ))
        .payload(json!({
            "job_type":     job_type,
            "failures":     failures,
            // The runner already truncates the message it stores, and it never
            // carries a credential — handlers put the reason there, not the input.
            "last_error":   last_error,
            "last_failure": last_failure,
        }))
        .dedup(&job_type);

        if let Some(module) = module_id {
            alert = alert.module(module);
        }

        live.push(alert.dedup_key.clone());
        report.note(store::raise(db, alert).await?);
    }

    report.auto_resolved += store::auto_resolve(db, catalog::JOB_DEAD_LETTER, &live).await?;
    Ok(())
}

/// The last backup attempt did not complete.
///
/// A **state** producer over `core.backup_runs`: one alert while the last
/// attempt is a failure, closed automatically by [`store::auto_resolve`] the
/// moment a run succeeds. That auto-closure is what makes it readable — an
/// operator who fixes the destination sees the alert clear on the next scan
/// rather than having to remember to close it.
///
/// It deliberately does **not** duplicate the "no recent backup" case:
/// `continuity.backup` goes critical there, and [`health_criticals`] turns that
/// into an alert already. Two kinds saying the same sentence is how a queue
/// stops being read.
async fn backup_failures(db: &PgPool, report: &mut ScanReport) -> Result<(), AppError> {
    let stats = crate::backup::runs::stats(db).await?;

    let failing = stats.last_status.as_deref() == Some("failed");
    let mut live = Vec::new();

    if failing {
        // One bad night is a warning; a run of them means the policy has stopped
        // working and nobody has noticed — which is the whole failure mode.
        let severity = if stats.consecutive_failures >= 3 {
            Severity::Critical
        } else {
            Severity::Warning
        };

        let alert = NewAlert::new(
            catalog::BACKUP_FAILED,
            catalog::SRC_BACKUP,
            severity,
            "The last backup did not complete",
        )
        .summary(
            "The scheduled dump of the core schema failed. Until it succeeds, this \
             instance has no fresh copy of its database.",
        )
        .payload(json!({
            "consecutive_failures": stats.consecutive_failures,
            "last_attempt_at":      stats.last_attempt_at,
            "last_success_at":      stats.last_success_at,
            // Composed from the failing step by `backup::jobs::execute`, already
            // truncated, and never built from an input: no path outside the
            // destination, no connection string, no credential.
            "last_error":           stats.last_error,
        }))
        // One dedup key for the whole feature: consecutive failures are the same
        // problem observed again, and the counter on the row is what says how
        // long it has been going on.
        .dedup("policy");

        live.push(alert.dedup_key.clone());
        report.note(store::raise(db, alert).await?);
    }

    report.auto_resolved += store::auto_resolve(db, catalog::BACKUP_FAILED, &live).await?;
    Ok(())
}

/// A run of failed sign-ins on one account.
///
/// Reads `core.admin_audit`, which records `core.auth.login_failed` for
/// administrator accounts — the ones whose compromise matters, and the reason
/// the trail does not fill up with misses on names a stranger invented.
async fn login_bursts(
    db: &PgPool,
    cfg: &Thresholds,
    report: &mut ScanReport,
) -> Result<(), AppError> {
    let rows = sqlx::query(
        r#"SELECT target_id,
                  MAX(target_label)                       AS target_label,
                  COUNT(*)                                AS failures,
                  COUNT(DISTINCT host(ip_address))        AS sources,
                  MAX(occurred_at)                        AS last_attempt
             FROM core.admin_audit
            WHERE action = 'core.auth.login_failed'
              AND target_id IS NOT NULL
              AND occurred_at >= NOW() - make_interval(mins => $1::int)
            GROUP BY target_id
           HAVING COUNT(*) >= $2"#,
    )
    .bind(cfg.login_window_min as i32)
    .bind(cfg.login_burst)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: lecture des échecs de connexion");
        AppError::Database(e)
    })?;

    let mut live = Vec::new();
    for row in &rows {
        let target_id: String = row.get("target_id");
        let label: Option<String> = row.get("target_label");
        let failures: i64 = row.get("failures");
        let sources: i64 = row.get("sources");
        let last_attempt: Option<DateTime<Utc>> = row.get("last_attempt");
        let label = label.unwrap_or_else(|| target_id.clone());

        // Three times the threshold in the same window is not somebody
        // mistyping their password.
        let severity = if failures >= cfg.login_burst * 3 {
            Severity::Critical
        } else {
            Severity::Warning
        };

        let mut alert = NewAlert::new(
            catalog::LOGIN_BURST,
            catalog::SRC_AUDIT,
            severity,
            format!("Repeated failed sign-ins on “{label}”"),
        )
        .summary(format!(
            "{failures} failed attempts in the last {} minutes, from {sources} address(es).",
            cfg.login_window_min
        ))
        .payload(json!({
            "user_id":        target_id,
            "username":       label,
            "failures":       failures,
            "sources":        sources,
            "window_minutes": cfg.login_window_min,
            "last_attempt":   last_attempt,
        }))
        .dedup(&target_id);

        if let Ok(uuid) = Uuid::parse_str(&target_id) {
            alert = alert.subject(uuid);
        }

        live.push(alert.dedup_key.clone());
        report.note(store::raise(db, alert).await?);
    }

    // A burst that stopped is over: the account is no longer under attack, and
    // leaving the alert open would make the queue a history book.
    report.auto_resolved += store::auto_resolve(db, catalog::LOGIN_BURST, &live).await?;
    Ok(())
}

// ── Event producers (never auto-closed) ──────────────────────────────────────

/// How far back the event producers look when they have never run.
///
/// Only a floor for the first pass: afterwards the **watermark** below decides,
/// so a fresh install does not ingest a year of audit history as a wall of
/// alerts, and a restart does not re-read what it already reported.
const EVENT_LOOKBACK_HOURS: i64 = 48;

/// Highest audit entry already turned into an alert of this kind.
///
/// Event producers deduplicate on the *problem* — the setting that keeps being
/// changed, the account that keeps being promoted — not on the audit row. That
/// is what makes four changes to one setting a single line with a counter of
/// four instead of four lines saying the same thing. But it also means the
/// deduplication key no longer stops a second pass from counting the same event
/// twice, so the reading itself has to advance: this watermark is that
/// advancement, kept in the payload of the alerts rather than in a settings row
/// nobody would think to look at.
async fn audit_watermark(db: &PgPool, kind: &str) -> Result<i64, AppError> {
    sqlx::query_scalar::<_, Option<i64>>(
        "SELECT MAX((payload->>'audit_id')::bigint) FROM core.alerts WHERE kind = $1",
    )
    .bind(kind)
    .fetch_one(db)
    .await
    .map(|v| v.unwrap_or(0))
    .map_err(|e| {
        tracing::error!(error = %e, kind = %kind, "alerts: lecture du repère de lecture du journal");
        AppError::Database(e)
    })
}

/// Somebody was granted an administrative role.
///
/// Deduplicated on **who received it**, not on the audit row: three grants to
/// the same person in one afternoon are one thing to look into, with a counter
/// of three. The payload keeps the most recent entry's id, which is both the
/// link into the trail and the watermark that stops the next pass re-counting
/// what this one already reported.
async fn privilege_grants(db: &PgPool, report: &mut ScanReport) -> Result<(), AppError> {
    let watermark = audit_watermark(db, catalog::PRIVILEGE_GRANTED).await?;

    let rows = sqlx::query(
        r#"SELECT id, occurred_at, actor_label, target_label, target_id, after
             FROM core.admin_audit
            WHERE action = 'core.role_assignments.create'
              AND outcome = 'success'
              AND id > $2
              AND occurred_at >= NOW() - make_interval(hours => $1::int)
            ORDER BY id"#,
    )
    .bind(EVENT_LOOKBACK_HOURS as i32)
    .bind(watermark)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: lecture des privilèges accordés");
        AppError::Database(e)
    })?;

    for row in &rows {
        let audit_id: i64 = row.get("id");
        let actor: String = row.get("actor_label");
        let target: Option<String> = row.get("target_label");
        let occurred_at: DateTime<Utc> = row.get("occurred_at");
        // The audit snapshot is already whitelisted and redacted upstream; only
        // the two descriptive fields are lifted out of it.
        let after: Option<Value> = row.get("after");
        let scope = after
            .as_ref()
            .and_then(|v| v.get("scope"))
            .and_then(Value::as_str)
            .unwrap_or("instance")
            .to_string();
        let target = target.unwrap_or_else(|| "—".to_string());

        let alert = NewAlert::new(
            catalog::PRIVILEGE_GRANTED,
            catalog::SRC_AUDIT,
            Severity::Warning,
            format!("Administrative privileges granted: {target}"),
        )
        .summary(format!("Granted by {actor}, scope “{scope}”."))
        .payload(json!({
            "audit_id":    audit_id,
            "actor_label": actor,
            "assignment":  target,
            "scope":       scope,
            "granted_at":  occurred_at,
        }))
        .dedup(&target);

        report.note(store::raise(db, alert).await?);
    }
    Ok(())
}

/// Settings whose change alters who gets in, or how.
///
/// The alert names the key and the operator; it never carries the value. The
/// audit trail is where the before/after lives, already redacted, and the second
/// copy is the one that would leak.
///
/// `backup.` is here for the one change nobody announces: switching the schedule
/// off, or pointing it at a directory that no longer exists. Neither shows up
/// anywhere else until the day somebody needs the file.
const SENSITIVE_PREFIXES: &[&str] = &["auth.", "security.", "mail.", "backup."];

/// Deduplicated on the **setting key**: a value an operator flipped four times
/// this afternoon is one line reading “×4”, not four lines saying the same
/// sentence. See [`audit_watermark`] for why the reading advances instead.
async fn sensitive_settings(db: &PgPool, report: &mut ScanReport) -> Result<(), AppError> {
    let patterns: Vec<String> = SENSITIVE_PREFIXES.iter().map(|p| format!("{p}%")).collect();
    let watermark = audit_watermark(db, catalog::SENSITIVE_SETTING).await?;

    let rows = sqlx::query(
        r#"SELECT id, occurred_at, actor_label, target_id, target_label
             FROM core.admin_audit
            WHERE action = 'core.settings.change'
              AND outcome = 'success'
              AND target_id IS NOT NULL
              AND target_id LIKE ANY($1)
              AND id > $3
              AND occurred_at >= NOW() - make_interval(hours => $2::int)
            ORDER BY id"#,
    )
    .bind(&patterns)
    .bind(EVENT_LOOKBACK_HOURS as i32)
    .bind(watermark)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: lecture des réglages sensibles modifiés");
        AppError::Database(e)
    })?;

    for row in &rows {
        let audit_id: i64 = row.get("id");
        let key: String = row.get("target_id");
        let label: Option<String> = row.get("target_label");
        let actor: String = row.get("actor_label");
        let occurred_at: DateTime<Utc> = row.get("occurred_at");

        let alert = NewAlert::new(
            catalog::SENSITIVE_SETTING,
            catalog::SRC_AUDIT,
            Severity::Warning,
            format!("Sensitive setting changed: {key}"),
        )
        .summary(format!(
            "{} was changed by {actor}. Confirm the change was intended.",
            label.unwrap_or_else(|| key.clone())
        ))
        .payload(json!({
            "audit_id":    audit_id,
            "setting_key": key,
            "actor_label": actor,
            "changed_at":  occurred_at,
        }))
        .dedup(&key);

        report.note(store::raise(db, alert).await?);
    }
    Ok(())
}

// ── Disk ─────────────────────────────────────────────────────────────────────

/// The volume holding the instance data is running out of room.
///
/// A plain `statvfs` read of the same path the health report uses. It is its own
/// alert rather than a promotion of the health check because that check is a
/// `warning` — it says "keep an eye on this" — while an alert is a piece of work
/// with an owner and a deadline.
async fn disk_pressure(
    db: &PgPool,
    settings: &Settings,
    cfg: &Thresholds,
    report: &mut ScanReport,
) -> Result<(), AppError> {
    let path = settings.storage.local_path().to_string();
    let mut live = Vec::new();

    // `None` means the volume could not be interrogated. That is reported by the
    // health check as "unknown"; turning it into an alert would be inventing a
    // problem out of a missing measurement.
    if let Some(usage) = disk::usage_of(Path::new(&path)) {
        let percent = (usage.available_ratio() * 100.0).round() as i64;
        if percent < cfg.disk_warn_percent {
            let severity = if percent < cfg.disk_critical_percent {
                Severity::Critical
            } else {
                Severity::Warning
            };

            let alert = NewAlert::new(
                catalog::DISK_LOW,
                catalog::SRC_STORAGE,
                severity,
                "The data volume is running out of room",
            )
            .summary(format!(
                "{percent} % of the volume is still writable. Below that, uploads fail and the database may be unable to write."
            ))
            .payload(json!({
                "available_percent": percent,
                "available_bytes":   usage.available_bytes,
                "total_bytes":       usage.total_bytes,
                "path":              path,
                "warn_percent":      cfg.disk_warn_percent,
                "critical_percent":  cfg.disk_critical_percent,
            }))
            .dedup("data-volume");

            live.push(alert.dedup_key.clone());
            report.note(store::raise(db, alert).await?);
        }
    }

    report.auto_resolved += store::auto_resolve(db, catalog::DISK_LOW, &live).await?;
    Ok(())
}

// ── Accounts against their own ceiling ───────────────────────────────────────

/// Accounts at or past the configured share of their quota.
///
/// A **state** producer: an account that was emptied is no longer a problem, and
/// `auto_resolve` closes its alert. One alert per account rather than one
/// "several accounts are full" — the fix is per account (raise this ceiling, or
/// ask this person to clean up), and a grouped alert would have no owner.
///
/// Deliberately bounded: an instance where three hundred accounts crossed the
/// line at once has one problem — the default quota is wrong — and three hundred
/// alerts about it is the failure mode the alert centre exists to avoid. Past
/// the cap the producer stops naming individuals and the storage page is where
/// the full list is read.
const MAX_QUOTA_ALERTS: i64 = 25;

async fn quota_pressure(
    db: &PgPool,
    cfg: &Thresholds,
    report: &mut ScanReport,
) -> Result<(), AppError> {
    let rows = sqlx::query(
        r#"SELECT id,
                  COALESCE(NULLIF(display_name, ''), username) AS label,
                  email, used_bytes, quota_bytes, org_unit_id
             FROM core.users
            WHERE is_active = TRUE
              AND quota_bytes > 0
              AND used_bytes * 100 >= quota_bytes * $1
            ORDER BY (used_bytes::float8 / quota_bytes) DESC
            LIMIT $2"#,
    )
    .bind(cfg.quota_percent)
    .bind(MAX_QUOTA_ALERTS)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "alerts: lecture des comptes saturés");
        AppError::Database(e)
    })?;

    let mut live = Vec::new();
    for row in &rows {
        let id: Uuid = row.get("id");
        let label: String = row.get("label");
        let used: i64 = row.get("used_bytes");
        let quota: i64 = row.get("quota_bytes");
        let unit: Option<Uuid> = row.get("org_unit_id");
        let percent = if quota > 0 { used * 100 / quota } else { 0 };

        // At or past 100 % the account can no longer store anything: that is an
        // outage for one person, not a warning about one.
        let severity = if used >= quota { Severity::Critical } else { Severity::Warning };

        let mut alert = NewAlert::new(
            catalog::QUOTA_EXCEEDED,
            catalog::SRC_STORAGE,
            severity,
            format!("“{label}” has filled their storage"),
        )
        .summary(if used >= quota {
            format!("{percent} % of the quota is used. Nothing more can be saved to this account until it is raised or emptied.")
        } else {
            format!("{percent} % of the quota is used. Past 100 % the account can no longer save anything.")
        })
        .payload(json!({
            "user_id":     id,
            "user_label":  label,
            // The address is what an operator needs to reach the person; it is
            // already in the audit trail and the directory, and the alert names
            // no other attribute of the account.
            "email":       row.get::<String, _>("email"),
            "used_bytes":  used,
            "quota_bytes": quota,
            "percent":     percent,
            "threshold":   cfg.quota_percent,
        }))
        .subject(id)
        .dedup(id);

        if let Some(unit_id) = unit {
            alert.org_unit_id = Some(unit_id);
        }

        live.push(alert.dedup_key.clone());
        report.note(store::raise(db, alert).await?);
    }

    report.auto_resolved += store::auto_resolve(db, catalog::QUOTA_EXCEEDED, &live).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn thresholds_are_clamped_into_something_usable() {
        let d = Thresholds::default();
        assert!(d.login_burst >= 2, "un seuil de 0 alerterait sur chaque faute de frappe");
        assert!(d.disk_critical_percent < d.disk_warn_percent);
        assert!(
            (50..=100).contains(&d.quota_percent),
            "un seuil sous 50 % décrirait un compte utilisé, pas un compte plein"
        );
        assert!(d.retention_days >= 7);
    }

    #[test]
    fn sensitive_prefixes_cover_the_ways_in() {
        assert!(SENSITIVE_PREFIXES.contains(&"auth."));
        assert!(SENSITIVE_PREFIXES.contains(&"security."));
    }
}
