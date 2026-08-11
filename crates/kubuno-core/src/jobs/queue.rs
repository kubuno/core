//! SQL side of the queue: enqueue, claim, complete, fail, crash recovery.
//!
//! Every statement targets `core.jobs` only. All of them are safe to run from
//! several processes at once — claiming relies on `FOR UPDATE SKIP LOCKED`.

use std::time::Duration;

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use super::Job;

/// PostgreSQL channel woken up when a job is inserted (see the trigger in
/// migration `000042`). Runners also poll, so a lost `NOTIFY` only costs
/// latency.
pub const JOB_CHANNEL: &str = "kubuno_jobs";

/// First retry delay. Doubles at every failed attempt.
const BACKOFF_BASE_SECS: u64 = 5;
/// Cap, so attempt 20 does not schedule a retry in the next century.
const BACKOFF_MAX_SECS: u64 = 3_600;
/// `core.jobs.error` is unbounded TEXT; a runaway error message would still be
/// pointless to store in full.
const MAX_ERROR_LEN: usize = 4_000;

/// Delay before the next attempt, given the number of attempts already made.
///
/// 1 → 5s, 2 → 10s, 3 → 20s … capped at one hour. Deliberately deterministic
/// (no jitter): the queue is per-instance and small, and predictable delays are
/// what makes the behaviour observable in the admin panel and in tests.
pub fn backoff_delay(attempts_made: i32) -> Duration {
    let exp = attempts_made.saturating_sub(1).clamp(0, 32) as u32;
    let secs = BACKOFF_BASE_SECS
        .saturating_mul(2u64.saturating_pow(exp))
        .min(BACKOFF_MAX_SECS);
    Duration::from_secs(secs)
}

fn truncate_error(err: &str) -> String {
    if err.len() <= MAX_ERROR_LEN {
        return err.to_string();
    }
    let mut end = MAX_ERROR_LEN;
    while end > 0 && !err.is_char_boundary(end) {
        end -= 1;
    }
    format!("{}…", &err[..end])
}

/// A job to insert.
#[derive(Debug, Clone)]
pub struct NewJob {
    pub job_type:     String,
    pub module_id:    Option<String>,
    pub payload:      serde_json::Value,
    pub max_attempts: i32,
    /// `None` = runnable immediately.
    pub run_after:    Option<DateTime<Utc>>,
}

impl NewJob {
    pub fn new(job_type: impl Into<String>) -> Self {
        Self {
            job_type:     job_type.into(),
            module_id:    None,
            payload:      serde_json::json!({}),
            max_attempts: 3,
            run_after:    None,
        }
    }

    pub fn module(mut self, module_id: impl Into<String>) -> Self {
        self.module_id = Some(module_id.into());
        self
    }

    pub fn payload(mut self, payload: serde_json::Value) -> Self {
        self.payload = payload;
        self
    }

    pub fn max_attempts(mut self, max_attempts: i32) -> Self {
        self.max_attempts = max_attempts.max(1);
        self
    }

    pub fn run_after(mut self, at: DateTime<Utc>) -> Self {
        self.run_after = Some(at);
        self
    }

    pub fn delay(self, delay: Duration) -> Self {
        let at = Utc::now() + chrono::Duration::from_std(delay).unwrap_or_default();
        self.run_after(at)
    }
}

/// Inserts a job. The insert trigger wakes the runners up.
pub async fn enqueue(db: &PgPool, job: NewJob) -> Result<Uuid, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO core.jobs (job_type, module_id, payload, max_attempts, run_after)
           VALUES ($1, $2, $3, $4, COALESCE($5, NOW()))
           RETURNING id"#,
    )
    .bind(&job.job_type)
    .bind(job.module_id.as_deref())
    .bind(&job.payload)
    .bind(job.max_attempts)
    .bind(job.run_after)
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, job_type = %job.job_type, "Insertion d'une tâche de fond échouée");
        e
    })
}

/// Inserts `job` only if no job of that type is already pending or running.
///
/// Used for recurring maintenance work: restarting the server, or two core
/// processes booting at once, must not pile up duplicates. Returns `None` when
/// one was already scheduled.
pub async fn ensure_scheduled(db: &PgPool, job: NewJob) -> Result<Option<Uuid>, sqlx::Error> {
    ensure_scheduled_inner(db, job, None).await
}

/// Same, ignoring `current` in the duplicate check — the form a recurring
/// handler uses to schedule its own next occurrence, since its own row is
/// still `running` while it does so.
pub async fn reschedule_after(
    db: &PgPool,
    job: NewJob,
    current: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    ensure_scheduled_inner(db, job, Some(current)).await
}

async fn ensure_scheduled_inner(
    db: &PgPool,
    job: NewJob,
    exclude: Option<Uuid>,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO core.jobs (job_type, module_id, payload, max_attempts, run_after)
           SELECT $1, $2, $3, $4, COALESCE($5, NOW())
           WHERE NOT EXISTS (
               SELECT 1 FROM core.jobs
                WHERE job_type = $1
                  AND status IN ('pending', 'running')
                  AND ($6::uuid IS NULL OR id <> $6)
           )
           RETURNING id"#,
    )
    .bind(&job.job_type)
    .bind(job.module_id.as_deref())
    .bind(&job.payload)
    .bind(job.max_attempts)
    .bind(job.run_after)
    .bind(exclude)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, job_type = %job.job_type, "Planification d'une tâche récurrente échouée");
        e
    })
}

/// Claims at most one runnable job among `job_types`.
///
/// The inner `SELECT … FOR UPDATE SKIP LOCKED LIMIT 1` picks a row and locks
/// it; concurrent claimers skip locked rows instead of blocking on them, so N
/// runners never hand the same job to two handlers. The surrounding `UPDATE`
/// flips it to `running` in the same statement — the row is never visible as
/// claimed-but-not-running.
pub async fn claim(db: &PgPool, job_types: &[String]) -> Result<Option<Job>, sqlx::Error> {
    if job_types.is_empty() {
        return Ok(None);
    }
    sqlx::query_as::<_, Job>(
        r#"UPDATE core.jobs AS j
              SET status     = 'running',
                  attempts   = j.attempts + 1,
                  started_at = NOW()
            WHERE j.id = (
                    SELECT c.id
                      FROM core.jobs AS c
                     WHERE c.status = 'pending'
                       AND c.run_after <= NOW()
                       AND c.job_type = ANY($1)
                     ORDER BY c.run_after, c.created_at
                     FOR UPDATE SKIP LOCKED
                     LIMIT 1
                  )
        RETURNING j.id, j.job_type, j.module_id, j.payload, j.attempts, j.max_attempts"#,
    )
    .bind(job_types)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "Réclamation d'une tâche de fond échouée");
        e
    })
}

/// Marks a job done.
pub async fn complete(db: &PgPool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE core.jobs SET status = 'done', done_at = NOW(), error = NULL WHERE id = $1")
        .bind(id)
        .execute(db)
        .await
        .map(|_| ())
        .map_err(|e| {
            tracing::error!(error = %e, job_id = %id, "Clôture d'une tâche de fond échouée");
            e
        })
}

/// What [`fail`] decided for a job.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FailOutcome {
    /// Back to `pending`, runnable again after `delay`.
    Retry { delay: Duration, attempts_left: i32 },
    /// `max_attempts` reached: `failed`, no further attempt.
    GaveUp,
}

/// Records a failed attempt: retry with an exponential backoff, or definitive
/// failure once `max_attempts` is reached.
pub async fn fail(db: &PgPool, job: &Job, error: &str) -> Result<FailOutcome, sqlx::Error> {
    let error = truncate_error(error);

    if job.attempts >= job.max_attempts {
        sqlx::query(
            "UPDATE core.jobs SET status = 'failed', done_at = NOW(), error = $2 WHERE id = $1",
        )
        .bind(job.id)
        .bind(&error)
        .execute(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, job_id = %job.id, "Marquage en échec définitif impossible");
            e
        })?;
        return Ok(FailOutcome::GaveUp);
    }

    let delay = backoff_delay(job.attempts);
    sqlx::query(
        r#"UPDATE core.jobs
              SET status = 'pending',
                  run_after = NOW() + make_interval(secs => $2::double precision),
                  error = $3
            WHERE id = $1"#,
    )
    .bind(job.id)
    .bind(delay.as_secs_f64())
    .bind(&error)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, job_id = %job.id, "Replanification après échec impossible");
        e
    })?;

    Ok(FailOutcome::Retry {
        delay,
        attempts_left: job.max_attempts - job.attempts,
    })
}

/// Crash recovery: jobs still `running` past `stalled_after` belong to a
/// process that died mid-flight (SIGKILL, OOM, power loss). Their attempt was
/// already counted at claim time, so a job that exhausted `max_attempts` this
/// way is closed as failed rather than looping forever.
///
/// Returns the number of rows recovered.
pub async fn requeue_stalled(db: &PgPool, stalled_after: Duration) -> Result<u64, sqlx::Error> {
    let rows = sqlx::query(
        r#"UPDATE core.jobs
              SET status    = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
                  run_after = NOW(),
                  done_at   = CASE WHEN attempts >= max_attempts THEN NOW() ELSE done_at END,
                  error     = 'Tâche interrompue (processus arrêté en cours d''exécution)'
            WHERE status = 'running'
              AND started_at IS NOT NULL
              AND started_at < NOW() - make_interval(secs => $1::double precision)"#,
    )
    .bind(stalled_after.as_secs_f64())
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "Reprise des tâches interrompues échouée");
        e
    })?;

    Ok(rows.rows_affected())
}

/// Wakes every listening runner up (used after a recovery pass, where rows
/// become runnable without any `INSERT` firing the trigger).
pub async fn notify_runners(db: &PgPool) {
    if let Err(e) = sqlx::query("SELECT pg_notify($1, '')")
        .bind(JOB_CHANNEL)
        .execute(db)
        .await
    {
        tracing::error!(error = %e, "pg_notify sur le canal des tâches échoué");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backoff_doubles_then_caps() {
        assert_eq!(backoff_delay(1), Duration::from_secs(5));
        assert_eq!(backoff_delay(2), Duration::from_secs(10));
        assert_eq!(backoff_delay(3), Duration::from_secs(20));
        assert_eq!(backoff_delay(4), Duration::from_secs(40));
        // Cap reached and never exceeded, even for absurd attempt counts.
        assert_eq!(backoff_delay(20), Duration::from_secs(BACKOFF_MAX_SECS));
        assert_eq!(backoff_delay(i32::MAX), Duration::from_secs(BACKOFF_MAX_SECS));
        // Defensive: a zero/negative attempt count must not underflow.
        assert_eq!(backoff_delay(0), Duration::from_secs(5));
        assert_eq!(backoff_delay(-3), Duration::from_secs(5));
    }

    #[test]
    fn error_is_truncated_on_a_char_boundary() {
        let long = "é".repeat(5_000);
        let out = truncate_error(&long);
        assert!(out.len() <= MAX_ERROR_LEN + 4);
        assert!(out.ends_with('…'));
        assert_eq!(truncate_error("court"), "court");
    }
}
