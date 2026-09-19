//! Publishing an event to the core, on an engine that may have no `NOTIFY`.
//!
//! Kubuno's event bus is PostgreSQL `LISTEN`/`NOTIFY`: a module publishes with
//! `SELECT pg_notify('kubuno_events', $1)` and the core, holding a dedicated
//! connection, receives it. Neither MySQL nor SQLite has anything like it.
//!
//! The fallback here is a **transactional outbox**: the event is inserted in
//! the module's own schema and the core picks it up. That keeps the module side
//! honest — the write and the event commit together, which `pg_notify` does not
//! even guarantee on PostgreSQL.
//!
//! ⚠️ **The reader does not exist yet.** On MySQL and SQLite the core still has
//! to grow a poller for `<schema>.kubuno_event_outbox`, and a way to discover
//! which schemas to poll. Until then, events are durably recorded and silently
//! undelivered. This is the largest piece of core work a non-PostgreSQL
//! deployment needs.

use chrono::Utc;

use crate::{dialect::Backend, query, DbPool, BACKEND};

/// The channel the core listens on.
pub const CHANNEL: &str = "kubuno_events";

/// Publishes an event. Best-effort at the call site, as today: the caller logs
/// and carries on.
///
/// `schema` is the module's namespace, needed for the outbox table on the
/// engines that have no `NOTIFY`.
pub async fn notify(
    pool: &DbPool,
    schema: &'static str,
    channel: &str,
    payload: &str,
) -> Result<(), sqlx::Error> {
    match BACKEND {
        Backend::Postgres => {
            query("SELECT pg_notify($1, $2)")?
                .bind(channel)
                .bind(payload)
                .execute(pool)
                .await?;
        }
        Backend::MySql | Backend::Sqlite => {
            let sql = format!(
                "INSERT INTO {schema}.kubuno_event_outbox (id, channel, payload, created_at) \
                 VALUES ($1, $2, $3, $4)"
            );
            query(&sql)?
                .bind(crate::new_id())
                .bind(channel)
                .bind(payload)
                .bind(Utc::now())
                .execute(pool)
                .await?;
        }
    }
    Ok(())
}

/// Creates the outbox table when the engine needs one. A no-op on PostgreSQL.
///
/// Call it once at start-up, next to the migrations. It is deliberately not a
/// migration: the table only exists on some engines, and a module's migration
/// files are per-engine anyway.
pub async fn ensure_outbox(pool: &DbPool, schema: &'static str) -> Result<(), sqlx::Error> {
    let ddl = match BACKEND {
        Backend::Postgres => return Ok(()),
        Backend::MySql => format!(
            "CREATE TABLE IF NOT EXISTS {schema}.kubuno_event_outbox (
                 id          BINARY(16)  NOT NULL PRIMARY KEY,
                 channel     VARCHAR(64) NOT NULL,
                 payload     LONGTEXT    NOT NULL,
                 created_at  DATETIME(6) NOT NULL,
                 delivered_at DATETIME(6) NULL,
                 INDEX idx_outbox_pending (delivered_at, created_at)
             )"
        ),
        Backend::Sqlite => format!(
            "CREATE TABLE IF NOT EXISTS {schema}.kubuno_event_outbox (
                 id           BLOB NOT NULL PRIMARY KEY,
                 channel      TEXT NOT NULL,
                 payload      TEXT NOT NULL,
                 created_at   TEXT NOT NULL,
                 delivered_at TEXT
             )"
        ),
    };
    query(&ddl)?.execute(pool).await?;
    Ok(())
}
