//! The backup page: the policy in force, what it has produced, and the two
//! things an operator can do about it from a screen.
//!
//! ## No write path for the policy
//!
//! The five settings are edited through `PUT /admin/settings/scoped/:key`, like
//! every other setting: one audited writer, one validator, one inheritance
//! chain. A second write path here would be a second place for the audit entry
//! to be forgotten — the same reasoning the storage page follows.
//!
//! What is here is what the settings route cannot express:
//!
//! * `POST /admin/backup/run` — enqueue a run now. Audited, and asynchronous on
//!   purpose: a dump of a large instance outlives an HTTP request, and a screen
//!   that hangs for four minutes is a screen an operator reloads, producing a
//!   second dump.
//! * `POST /admin/backup/restore-test` — record that somebody restored a backup
//!   and it worked. **Declarative**: the server writes a timestamp and an audit
//!   entry, verifies nothing, and never restores anything. The console says so
//!   next to the button, and so does the health check.
//!
//! ## Coverage is served, not hard-coded in the console
//!
//! `GET /admin/backup` returns what the dump covers and what it does not, from
//! [`crate::backup::COVERED`] / [`crate::backup::NOT_COVERED`]. The day somebody
//! widens the dump, the screen follows; it cannot go on promising something the
//! server stopped doing, or keep denying something it started doing.

use axum::{extract::State, Json};
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::{
    audit::{redact::target, AdminAudit},
    auth::middleware::AdminUser,
    authz::{keys, AdminCtx},
    backup::{self, policy, runs},
    errors::AppError,
    state::AppState,
};

/// How many past runs the page opens on. Enough to read a week of a daily
/// policy at a glance, bounded so the payload stays a page and not an archive.
const DEFAULT_HISTORY: i64 = 20;

/// `GET /admin/backup` — everything the page opens on.
pub async fn get_backup(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::BACKUP_READ)?;

    // A run left `running` by a process that died would otherwise be reported as
    // "in progress" for ever, and the manual trigger would refuse every attempt.
    if let Err(e) = runs::close_stalled(&state.db).await {
        tracing::error!(error = %e, "backup: reprise des exécutions interrompues");
    }

    let policy = policy::load(&state.db).await;
    let stats = runs::stats(&state.db).await?;
    let history = runs::list(&state.db, DEFAULT_HISTORY).await?;
    let restore_tested_at = policy::last_restore_test(&state.db).await;
    let running = runs::is_running(&state.db).await.unwrap_or(false);

    // The next occurrence as the scheduler itself computes it, not as the
    // console might re-derive it from the hour and the frequency: two readers of
    // the same rule drift, and the one that drifts is the one on screen.
    let next_run_at = policy
        .enabled
        .then(|| policy.next_run_after(Utc::now()));

    Ok(Json(json!({
        "policy": {
            "enabled":         policy.enabled,
            "frequency":       policy.frequency.as_str(),
            "hour_utc":        policy.hour_utc,
            "retention_count": policy.retention_count,
            "destination":     policy.destination,
            "stale_after_days": policy.stale_after_days(),
        },
        "next_run_at":   next_run_at,
        "running":       running,
        "stats":         stats,
        "history":       history,
        "restore_test": {
            "at":       restore_tested_at,
            // Repeated on the wire so no screen can render this as a verified
            // fact by forgetting a flag it never received.
            "declared": true,
        },
        // What is in the file, and what is not. Stable identifiers; the console
        // translates them.
        "covers":     backup::COVERED,
        "not_covers": backup::NOT_COVERED,
        "schema":     backup::dump::SCHEMA,
        "can_manage": ctx.has(keys::BACKUP_MANAGE),
    })))
}

/// `POST /admin/backup/run` — a backup, now.
///
/// Returns `202`-shaped payload (a job id) rather than the finished dump: the
/// work is minutes on a real instance, and holding the request open would make
/// a reload produce a second dump competing for the same disk.
pub async fn run_now(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::BACKUP_MANAGE)?;

    let policy = policy::load(&state.db).await;
    // Refused with the sentence that names the fix, rather than queued to fail
    // four minutes later in a history nobody is watching yet.
    policy::validate_destination(&policy.destination)?;

    if runs::is_running(&state.db).await.unwrap_or(false) {
        return Err(AppError::Conflict(
            "Une sauvegarde est déjà en cours".into(),
        ));
    }

    let label = audit
        .admin
        .display_name
        .clone()
        .filter(|n| !n.is_empty())
        .unwrap_or_else(|| audit.admin.username.clone());

    let job_id = backup::jobs::enqueue_manual(&state.db, audit.admin.id, &label).await?;

    // A standalone entry: the mutation this rides along with happens in a
    // background job, minutes later and on another connection. The trail records
    // the *decision*, which is the part a human took.
    audit
        .record(
            &state.db,
            crate::audit::AuditEntry::new("core.backup.run")
                .target_kind(target::SETTING, "backup")
                .detail(format!(
                    "Sauvegarde manuelle demandée (destination : {})",
                    policy.destination
                )),
        )
        .await;

    Ok(Json(json!({
        "message": "Sauvegarde demandée",
        "job_id":  job_id,
    })))
}

#[derive(Debug, Deserialize)]
pub struct RestoreTestDto {
    /// Free-text note from the operator: which file, on which machine. Optional,
    /// and stored only in the audit trail — the setting holds a date and nothing
    /// else, because the date is the only part any check reads.
    pub note: Option<String>,
    /// Clears the declaration instead of recording one. An operator who realises
    /// the drill did not actually prove anything must be able to take it back;
    /// a claim that can only be added is a claim nobody can trust.
    pub clear: Option<bool>,
}

/// Longest note accepted. Generous for a sentence, bounded so an audit entry
/// cannot become a document.
const MAX_NOTE: usize = 500;

/// `POST /admin/backup/restore-test` — record (or withdraw) a restore drill.
///
/// **Nothing is verified and nothing is restored.** The endpoint writes a
/// timestamp and an audit entry naming who declared it. That is stated in the
/// setting's description, in the health check's title and wording, and on the
/// screen next to the button — a declarative signal presented as a verified one
/// would be worse than no signal at all.
pub async fn declare_restore_test(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Json(dto): Json<RestoreTestDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::BACKUP_MANAGE)?;

    let note = dto.note.as_deref().map(str::trim).unwrap_or_default();
    if note.len() > MAX_NOTE {
        return Err(AppError::Validation(format!(
            "Note : {MAX_NOTE} caractères maximum"
        )));
    }

    let clearing = dto.clear.unwrap_or(false);
    let value = if clearing {
        Value::Null
    } else {
        json!(Utc::now().to_rfc3339())
    };

    let previous: Option<Value> = sqlx::query_scalar(
        "SELECT value FROM core.settings WHERE key = $1 FOR UPDATE",
    )
    .bind(policy::KEY_LAST_RESTORE_TEST)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "backup: lecture de la déclaration de restauration");
        AppError::Database(e)
    })?;

    if previous.is_none() {
        return Err(AppError::NotFound(format!(
            "Réglage '{}' inexistant",
            policy::KEY_LAST_RESTORE_TEST
        )));
    }

    let mut tx = audit.begin(&state.db).await?;
    // Written through `core.settings.value`, whose trigger (migration 000060)
    // mirrors it into the instance scope — the same path every other legacy
    // writer takes, so there is exactly one source of truth.
    sqlx::query(
        "UPDATE core.settings SET value = $1, updated_at = NOW(), updated_by = $2 WHERE key = $3",
    )
    .bind(&value)
    .bind(audit.admin.id)
    .bind(policy::KEY_LAST_RESTORE_TEST)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "backup: écriture de la déclaration de restauration");
        AppError::Database(e)
    })?;

    let entry = crate::audit::AuditEntry::new("core.backup.restore_test")
        .target(
            target::SETTING,
            policy::KEY_LAST_RESTORE_TEST,
            "Restauration testée (déclarative)".to_string(),
        )
        .before(previous.unwrap_or(Value::Null))
        .after(value.clone())
        .detail(if clearing {
            "Déclaration de restauration retirée".to_string()
        } else if note.is_empty() {
            "Restauration testée — déclaration sans vérification par la plateforme".to_string()
        } else {
            format!("Restauration testée (déclarative) — {note}")
        })
        .reversible();
    tx.commit(entry).await?;

    // The health check caches the verdict for a minute; a declaration that does
    // not show up is a button an operator presses twice.
    crate::health::invalidate();

    Ok(Json(json!({
        "message":  if clearing { "Déclaration retirée" } else { "Restauration testée enregistrée" },
        "at":       if clearing { Value::Null } else { value },
        "declared": true,
    })))
}
