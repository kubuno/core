//! Shared queue types and helpers: [`NewJob`], [`FailOutcome`], the backoff
//! schedule and error truncation. The engine-agnostic SQL lives in
//! [`super::portable`] and is re-exported at the bottom under the `queue::`
//! names the rest of the crate already uses.

use std::time::Duration;

use chrono::{DateTime, Utc};


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

pub(crate) fn truncate_error(err: &str) -> String {
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


/// What [`fail`] decided for a job.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FailOutcome {
    /// Back to `pending`, runnable again after `delay`.
    Retry { delay: Duration, attempts_left: i32 },
    /// `max_attempts` reached: `failed`, no further attempt.
    GaveUp,
}

// ── Engine-agnostic queue operations ────────────────────────────────────────
//
// The SQL side of the queue moved to [`super::portable`], written on
// `kubuno_db::DbPool` so the same `core.jobs` table is driven identically on
// PostgreSQL, MySQL/MariaDB and SQLite. The operations are re-exported here so
// every `queue::…` call site keeps working, now against `DbPool`.
pub use super::portable::{
    claim, complete, enqueue, ensure_scheduled, fail, notify_runners, requeue_stalled,
    reschedule_after,
};
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
