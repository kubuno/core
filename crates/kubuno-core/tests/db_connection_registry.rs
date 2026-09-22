//! Real proof of the database-connection registry (`core.db_connections`) on the
//! actual `core` schema, and of the copy the registry's "overwrite"/"sync" paths
//! run underneath.
//!
//! The registry semantics (register/idempotency, single-current invariant,
//! forget-refuses-current, sync timestamp, password sealing) are exercised
//! against a freshly-migrated `core`. SQLite always runs (embedded); PostgreSQL
//! runs the same registry checks when `KUBUNO_PG_TEST_URL` is set, otherwise it
//! prints a notice and is skipped. The cross-engine data copy the "overwrite" and
//! "sync" actions perform is proven with `kubuno_db::copy_schema` between two
//! migrated cores, mirroring what `switch (overwrite)` / `sync` do.

use kubuno_core::config::DbCredentials;
use kubuno_core::database::migrations;
use kubuno_core::modules::db_registry as registry;
use kubuno_db::{connect, copy_schema, params, DbPool, DbSettings};

const JWT: &str = "test-jwt-secret-that-is-long-enough-1234567890";

struct TempDir(std::path::PathBuf);
impl TempDir {
    fn new() -> Self {
        let p = std::env::temp_dir().join(format!("kubuno-connreg-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&p).expect("tmp dir");
        TempDir(p)
    }
    fn str(&self) -> &str {
        self.0.to_str().expect("utf8 path")
    }
}
impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

fn settings(engine: &str, extra: serde_json::Value) -> DbSettings {
    let mut base = serde_json::json!({
        "engine": engine, "max_connections": 4, "min_connections": 0,
        "connect_timeout": 15, "run_migrations": false,
    });
    base.as_object_mut().unwrap().extend(extra.as_object().unwrap().clone());
    serde_json::from_value(base).expect("DbSettings")
}

async fn sqlite_core(dir: &str) -> DbPool {
    let pool = connect(&settings("sqlite", serde_json::json!({ "path": dir })), "core")
        .await
        .expect("sqlite connect");
    migrations::run(&pool).await.expect("sqlite core migrations");
    pool
}

fn pg_creds() -> DbCredentials {
    DbCredentials {
        engine: "postgres".into(),
        host: "db.internal".into(),
        port: 6543,
        user: "kube".into(),
        password: "s3cr3t!".into(),
        database: "cal".into(),
        path: String::new(),
    }
}

fn sqlite_creds(dir: &str) -> DbCredentials {
    DbCredentials {
        engine: "sqlite".into(),
        host: String::new(),
        port: 0,
        user: String::new(),
        password: String::new(),
        database: String::new(),
        path: dir.into(),
    }
}

/// The full registry contract on a migrated `core`, reused across engines.
async fn assert_registry_contract(db: &DbPool) {
    // ── register + list + get ────────────────────────────────────────────────
    let a = registry::register(db, JWT, "core", &pg_creds(), Some("kub_"), None, true)
        .await
        .expect("register A");
    let rows = registry::list(db, "core").await.expect("list");
    assert_eq!(rows.len(), 1, "one connection registered");
    let row = registry::get(db, "core", a).await.expect("get").expect("row A exists");
    assert!(row.is_current, "A is current (make_current=true)");
    assert_eq!(row.db_user, "kube");
    assert_eq!(row.port, 6543);

    // ── password sealing: stored blob is not plaintext, round-trips, and a
    //    different key cannot open it ──────────────────────────────────────────
    assert!(!row.password_enc.is_empty(), "a password was stored");
    assert_ne!(row.password_enc, "s3cr3t!", "stored value is not plaintext");
    let creds = row.to_credentials(JWT).expect("decrypt");
    assert_eq!(creds.password, "s3cr3t!", "round-trips with the right key");
    assert!(row.to_credentials("another-secret-entirely-0987654321").is_err(),
        "a different key cannot open the blob");

    // ── idempotency: the same identity re-registers onto the SAME row ─────────
    let mut refreshed = pg_creds();
    refreshed.password = "rotated!".into();
    let a2 = registry::register(db, JWT, "core", &refreshed, Some("kub_"), None, false)
        .await
        .expect("re-register A");
    assert_eq!(a, a2, "same identity yields the same row id (no duplicate)");
    assert_eq!(registry::list(db, "core").await.unwrap().len(), 1, "still a single row");
    let row = registry::get(db, "core", a).await.unwrap().unwrap();
    assert_eq!(row.to_credentials(JWT).unwrap().password, "rotated!", "password refreshed on conflict");

    // ── a second, distinct connection, made current: single-current invariant ─
    let dir = TempDir::new();
    let b = registry::register(db, JWT, "core", &sqlite_creds(dir.str()), None, Some("Standby"), true)
        .await
        .expect("register B");
    let rows = registry::list(db, "core").await.unwrap();
    assert_eq!(rows.len(), 2, "two connections now");
    let current: Vec<_> = rows.iter().filter(|r| r.is_current).collect();
    assert_eq!(current.len(), 1, "exactly one current connection");
    assert_eq!(current[0].id, b, "B is the current one, A was flipped off");
    let b_row = registry::get(db, "core", b).await.unwrap().unwrap();
    assert_eq!(b_row.effective_label(), "Standby", "explicit label kept");
    assert_eq!(b_row.port, 0, "SQLite stores port 0");

    // ── forget refuses the current, allows a non-current ─────────────────────
    assert!(registry::forget(db, "core", b).await.is_err(), "cannot forget the current connection");
    registry::forget(db, "core", a).await.expect("forget the non-current A");
    assert_eq!(registry::list(db, "core").await.unwrap().len(), 1, "A is gone, B remains");

    // ── sync timestamp ───────────────────────────────────────────────────────
    let before = registry::get(db, "core", b).await.unwrap().unwrap();
    assert!(before.last_synced_at.is_none(), "never synced yet");
    registry::touch_synced(db, b).await.expect("touch synced");
    let after = registry::get(db, "core", b).await.unwrap().unwrap();
    assert!(after.last_synced_at.is_some(), "sync timestamp recorded");

    // ── ensure_current: no-op when a current exists, registers when absent ────
    registry::ensure_current(db, JWT, "core", &pg_creds(), Some("kub_")).await;
    assert_eq!(registry::list(db, "core").await.unwrap().len(), 1,
        "ensure_current is a no-op while a current connection exists");

    // A module scope with no current yet gets its live connection recorded.
    registry::ensure_current(db, JWT, "calendar", &pg_creds(), None).await;
    let m = registry::list(db, "calendar").await.unwrap();
    assert_eq!(m.len(), 1, "ensure_current seeded the module's current connection");
    assert!(m[0].is_current, "and flagged it current");
    assert!(!m[0].password_enc.is_empty(), "with its password sealed");
}

#[tokio::test]
async fn registry_contract_on_sqlite() {
    let dir = TempDir::new();
    let db = sqlite_core(dir.str()).await;
    assert_registry_contract(&db).await;
    println!("registry_contract_on_sqlite: OK");
}

#[tokio::test]
async fn registry_contract_on_postgres() {
    let Some(url) = std::env::var("KUBUNO_PG_TEST_URL").ok().filter(|u| !u.trim().is_empty()) else {
        println!("registry_contract_on_postgres: SKIPPED (set KUBUNO_PG_TEST_URL to run)");
        return;
    };
    let db = connect(&settings("postgres", serde_json::json!({ "url": url })), "core")
        .await
        .expect("pg connect");
    db.execute("DROP SCHEMA IF EXISTS core CASCADE", params![]).await.expect("drop");
    db.execute("CREATE SCHEMA core", params![]).await.expect("create");
    migrations::run(&db).await.expect("pg core migrations");
    assert_registry_contract(&db).await;
    println!("registry_contract_on_postgres: OK");
}

/// Proves the copy underneath "switch (overwrite)" and "sync": the current data is
/// carried onto the target, counts are verified, and the source is untouched.
#[tokio::test]
async fn overwrite_and_sync_copy_carries_data_and_verifies_counts() {
    let src_dir = TempDir::new();
    let dst_dir = TempDir::new();
    let src = sqlite_core(src_dir.str()).await;
    let dst = sqlite_core(dst_dir.str()).await;

    // A distinctive value on the source, and a different one on the target, so a
    // real overwrite is visible (not an identical seed).
    src.execute("UPDATE core.settings SET label = $1 WHERE key = $2",
        params!["src-marker", "instance.color_primary"])
        .await.expect("mark source");
    dst.execute("UPDATE core.settings SET label = $1 WHERE key = $2",
        params!["stale-marker", "instance.color_primary"])
        .await.expect("mark target stale");

    let src_settings: i64 = src.fetch_scalar("SELECT COUNT(*) FROM core.settings", params![])
        .await.expect("count source");
    assert!(src_settings > 0, "the migrations seed core.settings");

    // This is exactly what switch(overwrite)/sync run: copy current -> target.
    let report = copy_schema(&src, "core", &dst, "core", &mut |_, _| {})
        .await
        .expect("copy verifies counts and commits");
    assert!(report.total_rows >= src_settings, "copied at least the settings rows");

    // The target now holds the source's marker (its stale one was overwritten).
    let on_target: String = dst
        .fetch_scalar("SELECT label FROM core.settings WHERE key = $1", params!["instance.color_primary"])
        .await.expect("read target");
    assert_eq!(on_target, "src-marker", "target overwritten with current data");

    // The source is untouched.
    let on_source: String = src
        .fetch_scalar("SELECT label FROM core.settings WHERE key = $1", params!["instance.color_primary"])
        .await.expect("read source");
    assert_eq!(on_source, "src-marker", "source left intact");

    println!("overwrite_and_sync_copy_carries_data_and_verifies_counts: OK");
}
