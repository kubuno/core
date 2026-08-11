//! `core.backup_runs` — the record that turns a backup into something anybody
//! can believe.
//!
//! ## The rule of this file
//!
//! **The row is opened before the work starts.** A history written only on
//! success cannot distinguish "nothing ran" from "something ran and died", and
//! those are opposite emergencies: the first needs a scheduler, the second needs
//! a disk. Opening first also means a process killed mid-dump leaves a visibly
//! stuck `running` row instead of no trace at all — which is exactly the silence
//! this whole feature exists to break.
//!
//! Nothing here ever stores a path outside `destination`, a credential, or a
//! connection string: `file_name` is a base name and `error` is composed from
//! the failing step, never from an input.

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::errors::AppError;

/// `core.backup_runs.error` is unbounded `TEXT`; a runaway message is still
/// pointless to keep in full, and the console renders it inline.
const MAX_ERROR_LEN: usize = 2_000;

/// A `running` row older than this belongs to a process that is gone. Generous:
/// a first dump on a large instance is minutes, not hours, and closing a live
/// run as "interrupted" would be a lie in the other direction.
pub const STALE_RUN_HOURS: i64 = 6;

/// Who asked for the run.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Trigger {
    Scheduled,
    Manual,
}

impl Trigger {
    pub const fn as_str(self) -> &'static str {
        match self {
            Trigger::Scheduled => "scheduled",
            Trigger::Manual => "manual",
        }
    }

    pub fn parse(raw: &str) -> Option<Self> {
        match raw {
            "scheduled" => Some(Trigger::Scheduled),
            "manual" => Some(Trigger::Manual),
            _ => None,
        }
    }
}

/// One row of the history, as the API serves it.
#[derive(Debug, Clone, Serialize)]
pub struct BackupRun {
    pub id: Uuid,
    pub trigger_kind: String,
    pub triggered_by: Option<Uuid>,
    pub actor_label: Option<String>,
    pub status: String,
    pub started_at: DateTime<Utc>,
    pub finished_at: Option<DateTime<Utc>>,
    pub duration_ms: Option<i64>,
    pub file_name: Option<String>,
    pub destination: Option<String>,
    pub size_bytes: Option<i64>,
    pub tables_count: Option<i32>,
    pub rows_count: Option<i64>,
    pub error: Option<String>,
    /// The file this run produced has since been rotated out. The row stays:
    /// "a backup ran that night" and "the file is still there" are two facts.
    pub file_pruned: bool,
}

impl BackupRun {
    fn from_row(row: &sqlx::postgres::PgRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            trigger_kind: row.try_get("trigger_kind")?,
            triggered_by: row.try_get("triggered_by")?,
            actor_label: row.try_get("actor_label")?,
            status: row.try_get("status")?,
            started_at: row.try_get("started_at")?,
            finished_at: row.try_get("finished_at")?,
            duration_ms: row.try_get("duration_ms")?,
            file_name: row.try_get("file_name")?,
            destination: row.try_get("destination")?,
            size_bytes: row.try_get("size_bytes")?,
            tables_count: row.try_get("tables_count")?,
            rows_count: row.try_get("rows_count")?,
            error: row.try_get("error")?,
            file_pruned: row.try_get("file_pruned")?,
        })
    }
}

fn truncate(message: &str) -> String {
    if message.len() <= MAX_ERROR_LEN {
        return message.to_string();
    }
    let mut end = MAX_ERROR_LEN;
    while end > 0 && !message.is_char_boundary(end) {
        end -= 1;
    }
    format!("{}…", &message[..end])
}

/// Opens a run. Returns its id, which is the only handle the caller needs.
pub async fn open(
    db: &PgPool,
    trigger: Trigger,
    actor: Option<(Uuid, String)>,
    destination: &str,
) -> Result<Uuid, AppError> {
    let (actor_id, actor_label) = match actor {
        Some((id, label)) => (Some(id), Some(label)),
        None => (None, None),
    };

    sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO core.backup_runs (trigger_kind, triggered_by, actor_label, destination) \
         VALUES ($1, $2, $3, $4) RETURNING id",
    )
    .bind(trigger.as_str())
    .bind(actor_id)
    .bind(actor_label.as_deref())
    .bind(destination)
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "backup: ouverture d'une exécution impossible");
        AppError::Database(e)
    })
}

/// Closes a run as successful.
pub async fn succeed(
    db: &PgPool,
    id: Uuid,
    outcome: &super::dump::DumpOutcome,
    duration_ms: i64,
) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.backup_runs \
            SET status = 'success', finished_at = NOW(), duration_ms = $2, \
                file_name = $3, size_bytes = $4, tables_count = $5, rows_count = $6, error = NULL \
          WHERE id = $1",
    )
    .bind(id)
    .bind(duration_ms.max(0))
    .bind(&outcome.file_name)
    .bind(outcome.size_bytes as i64)
    .bind(outcome.tables as i32)
    .bind(outcome.rows as i64)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, run_id = %id, "backup: clôture d'une exécution réussie impossible");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Closes a run as failed. The message is the operator's only clue, so it is
/// stored verbatim (truncated) rather than reduced to a code.
pub async fn fail(db: &PgPool, id: Uuid, error: &str, duration_ms: i64) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.backup_runs \
            SET status = 'failed', finished_at = NOW(), duration_ms = $2, error = $3 \
          WHERE id = $1",
    )
    .bind(id)
    .bind(duration_ms.max(0))
    .bind(truncate(error))
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, run_id = %id, "backup: clôture d'une exécution en échec impossible");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Closes rows left `running` by a process that died mid-dump.
///
/// The equivalent of [`crate::jobs::queue::requeue_stalled`], for the history
/// rather than the queue: without it the console would keep showing "a backup is
/// running" for a process that stopped last month, and the concurrency guard
/// below would refuse every new run for ever.
pub async fn close_stalled(db: &PgPool) -> Result<u64, AppError> {
    let rows = sqlx::query(
        "UPDATE core.backup_runs \
            SET status = 'failed', finished_at = NOW(), \
                error = 'Sauvegarde interrompue (processus arrêté en cours d''exécution)' \
          WHERE status = 'running' \
            AND started_at < NOW() - make_interval(hours => $1::int)",
    )
    .bind(STALE_RUN_HOURS as i32)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "backup: reprise des exécutions interrompues impossible");
        AppError::Database(e)
    })?;
    Ok(rows.rows_affected())
}

/// Is a run already in flight?
///
/// Two dumps at once are not a corruption — the file names differ to the second
/// — but they double the I/O of the one operation an instance runs precisely
/// when it is least able to afford it.
pub async fn is_running(db: &PgPool) -> Result<bool, AppError> {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (SELECT 1 FROM core.backup_runs WHERE status = 'running')",
    )
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "backup: lecture des exécutions en cours impossible");
        AppError::Database(e)
    })
}

/// Marks the rows whose file the retention pass has just removed.
pub async fn mark_pruned(db: &PgPool, file_names: &[String]) -> Result<(), AppError> {
    if file_names.is_empty() {
        return Ok(());
    }
    sqlx::query("UPDATE core.backup_runs SET file_pruned = TRUE WHERE file_name = ANY($1)")
        .bind(file_names)
        .execute(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "backup: marquage des fichiers supprimés impossible");
            AppError::Database(e)
        })?;
    Ok(())
}

/// The most recent runs, newest first.
pub async fn list(db: &PgPool, limit: i64) -> Result<Vec<BackupRun>, AppError> {
    let limit = limit.clamp(1, 200);
    let rows = sqlx::query(
        "SELECT id, trigger_kind, triggered_by, actor_label, status, started_at, finished_at, \
                duration_ms, file_name, destination, size_bytes, tables_count, rows_count, \
                error, file_pruned \
           FROM core.backup_runs ORDER BY started_at DESC LIMIT $1",
    )
    .bind(limit)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "backup: lecture de l'historique impossible");
        AppError::Database(e)
    })?;

    rows.iter()
        .map(BackupRun::from_row)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| {
            tracing::error!(error = %e, "backup: décodage de l'historique impossible");
            AppError::Database(e)
        })
}

/// What the health check and the alert producer both need, in one round trip.
#[derive(Debug, Clone, Default, Serialize)]
pub struct RunStats {
    /// When a backup last actually succeeded. `None` means never — which the
    /// console renders as "never", never as "unknown".
    pub last_success_at: Option<DateTime<Utc>>,
    pub last_success_bytes: Option<i64>,
    pub last_success_file: Option<String>,
    /// Outcome of the most recent attempt, whatever it was.
    pub last_status: Option<String>,
    pub last_attempt_at: Option<DateTime<Utc>>,
    pub last_error: Option<String>,
    /// Failures since the last success. One is a bad night; three in a row is a
    /// policy that has stopped working.
    pub consecutive_failures: i64,
    pub total_runs: i64,
}

pub async fn stats(db: &PgPool) -> Result<RunStats, AppError> {
    let row = sqlx::query(
        r#"WITH last_ok AS (
               SELECT finished_at, size_bytes, file_name
                 FROM core.backup_runs
                WHERE status = 'success'
                ORDER BY finished_at DESC
                LIMIT 1
           ),
           last_any AS (
               SELECT status, started_at, error
                 FROM core.backup_runs
                WHERE status <> 'running'
                ORDER BY started_at DESC
                LIMIT 1
           )
           SELECT (SELECT finished_at FROM last_ok)                        AS last_success_at,
                  (SELECT size_bytes  FROM last_ok)                        AS last_success_bytes,
                  (SELECT file_name   FROM last_ok)                        AS last_success_file,
                  (SELECT status      FROM last_any)                       AS last_status,
                  (SELECT started_at  FROM last_any)                       AS last_attempt_at,
                  (SELECT error       FROM last_any)                       AS last_error,
                  (SELECT COUNT(*)::bigint FROM core.backup_runs
                    WHERE status = 'failed'
                      AND started_at > COALESCE((SELECT finished_at FROM last_ok),
                                                TIMESTAMPTZ '-infinity'))  AS consecutive_failures,
                  (SELECT COUNT(*)::bigint FROM core.backup_runs)          AS total_runs"#,
    )
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "backup: lecture de l'état des sauvegardes impossible");
        AppError::Database(e)
    })?;

    Ok(RunStats {
        last_success_at: row.try_get("last_success_at").unwrap_or(None),
        last_success_bytes: row.try_get("last_success_bytes").unwrap_or(None),
        last_success_file: row.try_get("last_success_file").unwrap_or(None),
        last_status: row.try_get("last_status").unwrap_or(None),
        last_attempt_at: row.try_get("last_attempt_at").unwrap_or(None),
        last_error: row.try_get("last_error").unwrap_or(None),
        consecutive_failures: row.try_get("consecutive_failures").unwrap_or(0),
        total_runs: row.try_get("total_runs").unwrap_or(0),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn triggers_round_trip() {
        assert_eq!(Trigger::parse("manual"), Some(Trigger::Manual));
        assert_eq!(Trigger::parse("scheduled"), Some(Trigger::Scheduled));
        assert_eq!(Trigger::parse("cron"), None);
        assert_eq!(Trigger::Manual.as_str(), "manual");
    }

    #[test]
    fn a_long_error_is_cut_on_a_character_boundary() {
        let long = "é".repeat(4_000);
        let out = truncate(&long);
        assert!(out.len() <= MAX_ERROR_LEN + 4);
        assert!(out.ends_with('…'));
        assert_eq!(truncate("court"), "court");
    }
}
