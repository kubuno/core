//! Background job runner backed by the `core.jobs` table.
//!
//! The table has existed since migration `000005` but had no consumer: nothing
//! could be done off the request path (mail delivery, purges, rule previews,
//! data transfers). This module is that consumer.
//!
//! Design in one paragraph: producers `INSERT` a row (see [`queue::enqueue`]);
//! an `AFTER INSERT` trigger fires `pg_notify('kubuno_jobs', …)`; every runner
//! listens on that channel and *also* polls every few seconds, because a
//! `NOTIFY` is lost when the listener happens to be reconnecting. A runner
//! claims one row at a time with `SELECT … FOR UPDATE SKIP LOCKED` wrapped in
//! an `UPDATE … RETURNING`, so N runners (several core processes, or several
//! tasks in one process) never pick the same job. Failures are retried with an
//! exponential backoff and give up past `max_attempts`. Jobs left `running` by
//! a crashed process are put back in the queue at startup and periodically.
//!
//! Adding a new job type never touches the runner:
//!
//! ```ignore
//! let mut registry = JobRegistry::new();
//! registry.register_fn("mail.send", |ctx, job| async move {
//!     mail::deliver(&ctx.db, job.payload).await
//! });
//! // …then, from anywhere holding a PgPool:
//! jobs::enqueue(&db, NewJob::new("mail.send").payload(json!({ "to": … }))).await?;
//! ```

pub mod builtin;
pub mod queue;
pub mod registry;
pub mod runner;

use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

pub use queue::{enqueue, ensure_scheduled, NewJob};
pub use registry::{JobContext, JobHandler, JobRegistry};
pub use runner::{JobRunnerConfig, JobRunnerHandle};

/// A claimed job, as handed to its handler.
#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Job {
    pub id:           Uuid,
    pub job_type:     String,
    pub module_id:    Option<String>,
    pub payload:      serde_json::Value,
    /// Attempts made *including* the current one (incremented at claim time).
    pub attempts:     i32,
    pub max_attempts: i32,
}
