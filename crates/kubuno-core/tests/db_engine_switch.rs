//! Real proof of the #3 engine switch on the actual `core` schema: migrate a
//! freshly-seeded core onto another engine and copy every table across, then
//! read a custom row back on the target.
//!
//! This exercises exactly what `handlers::admin::db_switch::migrate_core_database`
//! does under the hood — `database::migrations::run` on the target followed by
//! `kubuno_db::copy_schema` — so a green run here is a green core switch.
//!
//! SQLite → SQLite always runs (embedded). PostgreSQL → SQLite runs when
//! `KUBUNO_PG_TEST_URL` is set, otherwise it prints a notice and is skipped.

use kubuno_core::database::migrations;
use kubuno_db::{connect, copy_schema, params, DbPool, DbSettings};

struct TempDir(std::path::PathBuf);
impl TempDir {
    fn new() -> Self {
        let p = std::env::temp_dir().join(format!("kubuno-coreswitch-{}", uuid::Uuid::new_v4()));
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

async fn sqlite_core(dir: &str, schema: &'static str) -> DbPool {
    connect(&settings("sqlite", serde_json::json!({ "path": dir })), schema).await.expect("sqlite connect")
}

/// Wipes and re-migrates a PostgreSQL `core` schema on the shared test server.
async fn fresh_pg_core() -> Option<DbPool> {
    let url = std::env::var("KUBUNO_PG_TEST_URL").ok().filter(|u| !u.trim().is_empty())?;
    let pool = connect(&settings("postgres", serde_json::json!({ "url": url })), "core")
        .await
        .expect("pg connect");
    pool.execute("DROP SCHEMA IF EXISTS core CASCADE", params![]).await.expect("drop");
    pool.execute("CREATE SCHEMA core", params![]).await.expect("create");
    migrations::run(&pool).await.expect("pg core migrations");
    Some(pool)
}

const CUSTOM_KEY: &str = "instance.color_primary";

/// Copies a freshly-migrated `core` from `src` onto `dst` and proves a specific
/// row survived and the settings count matches.
async fn assert_core_copies(src: &DbPool, dst: &DbPool) {
    // A distinctive value on the source, so we can tell a real copy from an
    // identical seed.
    src.execute(
        "UPDATE core.settings SET value = $1 WHERE key = $2",
        params![serde_json::json!("#abcdef"), CUSTOM_KEY],
    )
    .await
    .expect("mark source");

    let src_settings: i64 = src
        .fetch_scalar("SELECT COUNT(*) FROM core.settings", params![])
        .await
        .expect("count source settings");
    assert!(src_settings > 0, "the migrations seed core.settings");

    let report = copy_schema(src, "core", dst, "core", &mut |_, _| {})
        .await
        .expect("copy core schema across engines");
    assert!(report.total_rows >= src_settings, "copied at least the settings rows");

    let dst_settings: i64 = dst
        .fetch_scalar("SELECT COUNT(*) FROM core.settings", params![])
        .await
        .expect("count target settings");
    assert_eq!(dst_settings, src_settings, "settings row count matches after copy");

    // The distinctive value landed on the target.
    let value: serde_json::Value = dst
        .fetch_scalar("SELECT value FROM core.settings WHERE key = $1", params![CUSTOM_KEY])
        .await
        .expect("read copied value");
    let text = value.as_str().or_else(|| value.get(0).and_then(|v| v.as_str()));
    // The value column is JSON; on some engines it round-trips as a JSON string.
    assert!(
        value == serde_json::json!("#abcdef") || text == Some("#abcdef"),
        "the custom value copied across, got {value:?}"
    );
}

#[tokio::test]
async fn core_switch_sqlite_to_sqlite() {
    let src_dir = TempDir::new();
    let dst_dir = TempDir::new();
    let src = sqlite_core(src_dir.str(), "core").await;
    migrations::run(&src).await.expect("src migrations");
    let dst = sqlite_core(dst_dir.str(), "core").await;
    migrations::run(&dst).await.expect("dst migrations");
    assert_core_copies(&src, &dst).await;
}

#[tokio::test]
async fn core_switch_pg_to_sqlite() {
    let Some(src) = fresh_pg_core().await else {
        eprintln!("KUBUNO_PG_TEST_URL non défini — core_switch_pg_to_sqlite ignoré");
        return;
    };
    let dst_dir = TempDir::new();
    let dst = sqlite_core(dst_dir.str(), "core").await;
    migrations::run(&dst).await.expect("dst migrations");
    assert_core_copies(&src, &dst).await;
    let _ = src.execute("DROP SCHEMA IF EXISTS core CASCADE", params![]).await;
}
