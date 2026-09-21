//! Portability of the two pieces a non-PostgreSQL deployment could not do
//! before: the background-job queue and the event bus.
//!
//! * **Job queue** ([`kubuno_core::jobs::portable`]) — enqueue, the
//!   `rows_affected`-checked claim (the portable replacement for `FOR UPDATE
//!   SKIP LOCKED`), dedup scheduling, retry/give-up and stalled recovery.
//! * **Event bus** ([`kubuno_core::database::outbox`]) — an event written to
//!   `core.kubuno_event_outbox` by `kubuno_db::events::notify` is drained by the
//!   poller onto the in-process `EventBus`, exactly once.
//!
//! SQLite is embedded, so it always runs. PostgreSQL and MySQL/MariaDB run only
//! when `KUBUNO_PG_TEST_URL` / `KUBUNO_MYSQL_TEST_URL` are set; otherwise they
//! print a notice and are skipped (CI without a server must not turn red).

use std::time::Duration;

use chrono::Utc;
use kubuno_core::database::outbox::OutboxPoller;
use kubuno_core::events::{AppEvent, EventBus};
use kubuno_core::jobs::portable;
use kubuno_core::jobs::queue::{FailOutcome, NewJob};
use kubuno_core::jobs::Job;
use kubuno_db::{connect, params, Backend, DbPool, DbSettings};
use std::sync::Arc;
use uuid::Uuid;

const SCHEMA: &str = "core";

/// Builds a `DbSettings` from JSON (the section is normally deserialized from
/// config; `connect_timeout` is seconds).
fn settings(engine: &str, extra: serde_json::Value) -> DbSettings {
    let mut base = serde_json::json!({
        "engine": engine,
        "max_connections": 4,
        "min_connections": 0,
        "connect_timeout": 10,
        "run_migrations": false,
    });
    base.as_object_mut()
        .unwrap()
        .extend(extra.as_object().unwrap().clone());
    serde_json::from_value(base).expect("DbSettings")
}

async fn sqlite_pool(dir: &std::path::Path) -> DbPool {
    let s = settings(
        "sqlite",
        serde_json::json!({ "path": dir.to_str().unwrap() }),
    );
    connect(&s, SCHEMA).await.expect("sqlite connect")
}

async fn maybe_pool(engine: &str, env: &str) -> Option<DbPool> {
    let url = std::env::var(env).ok().filter(|u| !u.trim().is_empty());
    match url {
        Some(url) => {
            let s = settings(engine, serde_json::json!({ "url": url }));
            match connect(&s, SCHEMA).await {
                Ok(p) => Some(p),
                Err(e) => panic!("{engine} connect ({env}) échoué: {e}"),
            }
        }
        None => {
            eprintln!("{env} absent — {engine} ignoré");
            None
        }
    }
}

/// Creates a fresh `core` namespace with the two tables the test drives, in the
/// pool's own dialect. Drops first so the test is idempotent on a shared server.
async fn setup(pool: &DbPool) {
    kubuno_db::pool::ensure_schema(pool, SCHEMA)
        .await
        .expect("ensure schema");
    for t in ["core.jobs", "core.kubuno_event_outbox"] {
        pool.execute(&format!("DROP TABLE IF EXISTS {t}"), params![])
            .await
            .expect("drop");
    }

    let jobs_ddl = match pool.backend() {
        Backend::Postgres => {
            "CREATE TABLE core.jobs (
                 id UUID PRIMARY KEY, job_type VARCHAR(100) NOT NULL, module_id VARCHAR(100),
                 payload JSONB NOT NULL DEFAULT '{}', status VARCHAR(20) NOT NULL DEFAULT 'pending',
                 attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 3,
                 error TEXT, run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                 started_at TIMESTAMPTZ, done_at TIMESTAMPTZ,
                 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
        }
        Backend::MySql => {
            "CREATE TABLE core.jobs (
                 id BINARY(16) PRIMARY KEY, job_type VARCHAR(100) NOT NULL, module_id VARCHAR(100),
                 payload JSON NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending',
                 attempts INT NOT NULL DEFAULT 0, max_attempts INT NOT NULL DEFAULT 3,
                 error TEXT, run_after DATETIME(6) NOT NULL,
                 started_at DATETIME(6), done_at DATETIME(6),
                 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6))"
        }
        Backend::Sqlite => {
            "CREATE TABLE core.jobs (
                 id BLOB PRIMARY KEY, job_type TEXT NOT NULL, module_id TEXT,
                 payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
                 attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 3,
                 error TEXT, run_after TEXT NOT NULL,
                 started_at TEXT, done_at TEXT,
                 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
        }
    };
    pool.execute(jobs_ddl, params![]).await.expect("create jobs");

    // The outbox: kubuno-db creates it for MySQL/SQLite; PostgreSQL needs it here.
    if pool.backend() == Backend::Postgres {
        pool.execute(
            "CREATE TABLE core.kubuno_event_outbox (
                 id UUID PRIMARY KEY, channel VARCHAR(64) NOT NULL, payload TEXT NOT NULL,
                 created_at TIMESTAMPTZ NOT NULL, delivered_at TIMESTAMPTZ)",
            params![],
        )
        .await
        .expect("create outbox pg");
    } else {
        kubuno_db::events::ensure_outbox(pool, SCHEMA)
            .await
            .expect("ensure outbox");
    }
}

// ── Chantier C: the portable job queue ──────────────────────────────────────

async fn exercise_jobs(pool: &DbPool) {
    let types = vec!["report".to_string()];

    // Enqueue two runnable jobs.
    let a = portable::enqueue(pool, NewJob::new("report").payload(serde_json::json!({"n": 1})))
        .await
        .unwrap();
    let _b = portable::enqueue(pool, NewJob::new("report").payload(serde_json::json!({"n": 2})))
        .await
        .unwrap();

    // Claim once: exactly one row flips to running, ordered oldest-first.
    let j1: Job = portable::claim(pool, &types).await.unwrap().expect("claim 1");
    assert_eq!(j1.id, a, "oldest job claimed first");
    assert_eq!(j1.attempts, 1, "attempt counted at claim");
    assert_eq!(j1.payload, serde_json::json!({"n": 1}), "payload round-trips");

    // The claimed row is no longer pending: a second claim gets the other one,
    // never the same row twice.
    let j2: Job = portable::claim(pool, &types).await.unwrap().expect("claim 2");
    assert_ne!(j2.id, j1.id, "no row is claimed twice");

    // Nothing runnable left.
    assert!(portable::claim(pool, &types).await.unwrap().is_none());

    // Complete one, fail the other with retries until it gives up.
    portable::complete(pool, j1.id).await.unwrap();

    let mut running = j2.clone();
    // attempts=1, max=3 → two retries then give up.
    match portable::fail(pool, &running, "boom").await.unwrap() {
        FailOutcome::Retry { attempts_left, .. } => assert_eq!(attempts_left, 2),
        FailOutcome::GaveUp => panic!("should retry"),
    }
    // Simulate the reclaim bumping attempts before the next failure.
    running.attempts = 3;
    assert_eq!(
        portable::fail(pool, &running, "boom again").await.unwrap(),
        FailOutcome::GaveUp
    );

    // Dedup scheduling: while a 'sweep' is pending, a second ensure is a no-op.
    let first = portable::ensure_scheduled(pool, NewJob::new("sweep"))
        .await
        .unwrap();
    assert!(first.is_some(), "first schedule inserts");
    let second = portable::ensure_scheduled(pool, NewJob::new("sweep"))
        .await
        .unwrap();
    assert!(second.is_none(), "duplicate schedule is refused");

    // Stalled recovery: a row stuck in 'running' past the cutoff is requeued.
    let stalled = portable::enqueue(pool, NewJob::new("stuck")).await.unwrap();
    let past = Utc::now() - chrono::Duration::hours(1);
    pool.execute(
        "UPDATE core.jobs SET status = 'running', started_at = $1, attempts = 1 WHERE id = $2",
        params![past, stalled],
    )
    .await
    .unwrap();
    let recovered = portable::requeue_stalled(pool, Duration::from_secs(60))
        .await
        .unwrap();
    assert!(recovered >= 1, "stalled row recovered");
    let status: String = pool
        .fetch_scalar("SELECT status FROM core.jobs WHERE id = $1", params![stalled])
        .await
        .unwrap();
    assert_eq!(status, "pending", "recovered back to pending");
}

// ── Chantier B: the outbox reader (event bus) ───────────────────────────────

async fn exercise_outbox(pool: &DbPool) {
    let bus = Arc::new(EventBus::new(64));
    let mut rx = bus.subscribe();
    let poller = OutboxPoller::new(pool.clone(), bus.clone());

    // Two real events written the way a background writer does.
    let uid = Uuid::new_v4();
    let ev = AppEvent::UserCreated {
        user_id: uid,
        email: "a@b.c".into(),
    };
    let payload = serde_json::to_string(&serde_json::json!({
        "event": ev, "meta": {},
    }))
    .unwrap();
    kubuno_db::events::notify(pool, SCHEMA, "kubuno_events", &payload)
        .await
        .unwrap();
    kubuno_db::events::notify(pool, SCHEMA, "kubuno_events", &payload)
        .await
        .unwrap();
    // A row on another channel: drained (marked delivered) but not published.
    kubuno_db::events::notify(pool, SCHEMA, "kubuno_jobs", "")
        .await
        .unwrap();

    let delivered = poller.drain_once().await.unwrap();
    assert_eq!(delivered, 3, "all three rows claimed");

    // Exactly the two events reached the bus.
    let mut seen = 0;
    while let Ok(env) = rx.try_recv() {
        match &env.event {
            AppEvent::UserCreated { user_id, .. } => assert_eq!(*user_id, uid),
            other => panic!("unexpected event: {other:?}"),
        }
        seen += 1;
    }
    assert_eq!(seen, 2, "only kubuno_events rows are published");

    // Exactly once: a second drain has nothing left.
    assert_eq!(poller.drain_once().await.unwrap(), 0, "nothing redelivered");
}

async fn run_all(pool: &DbPool) {
    setup(pool).await;
    exercise_jobs(pool).await;
    // The transactional outbox is the fallback for engines WITHOUT
    // `LISTEN`/`NOTIFY`: on PostgreSQL `kubuno_db::events::notify` publishes with
    // `pg_notify` and writes no outbox row, so the poller has nothing to drain
    // (that path is covered by the `PgListener` reader). Exercise the outbox
    // only where it is actually the delivery mechanism.
    if pool.backend() != Backend::Postgres {
        exercise_outbox(pool).await;
    }
}

#[tokio::test]
async fn sqlite_end_to_end() {
    let dir = tempdir();
    let pool = sqlite_pool(&dir).await;
    run_all(&pool).await;
}

#[tokio::test]
async fn postgres_end_to_end() {
    if let Some(pool) = maybe_pool("postgres", "KUBUNO_PG_TEST_URL").await {
        run_all(&pool).await;
    }
}

#[tokio::test]
async fn mysql_end_to_end() {
    if let Some(pool) = maybe_pool("mysql", "KUBUNO_MYSQL_TEST_URL").await {
        run_all(&pool).await;
    }
}

/// A throwaway directory for the SQLite files, removed on drop.
struct TempDir(std::path::PathBuf);
impl std::ops::Deref for TempDir {
    type Target = std::path::Path;
    fn deref(&self) -> &std::path::Path {
        &self.0
    }
}
impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}
fn tempdir() -> TempDir {
    let p = std::env::temp_dir().join(format!("kubuno-core-dbport-{}", Uuid::new_v4()));
    std::fs::create_dir_all(&p).unwrap();
    TempDir(p)
}
