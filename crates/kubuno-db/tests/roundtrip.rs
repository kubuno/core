//! Exercises the foundation against a real server of the compiled-in engine.
//!
//! SQLite runs unconditionally, on a temporary file. PostgreSQL and MySQL need
//! a server, so they read their connection from the environment and **fail**
//! rather than skip when it is missing — a test that quietly does nothing is
//! worse than no test:
//!
//! ```sh
//! KUBUNO_DB_TEST_URL=postgres://kbdbtest:kbdbtest@localhost/kbdbtest \
//!   cargo test -p kubuno-db --no-default-features --features backend-postgres
//! KUBUNO_DB_TEST_URL=mysql://kbdbtest:kbdbtest@localhost/kbdbtest \
//!   cargo test -p kubuno-db --no-default-features --features backend-mysql
//! ```

use chrono::{DateTime, Utc};
use kubuno_db as db;
use kubuno_db::dialect::{self, column, Assign, SqlType};
use sqlx::Row;
use uuid::Uuid;

/// The namespace the test writes into. Never a production schema.
const SCHEMA: &str = "kbdbtest";

// `&'static str` is what the dialect helpers take; a const gives it to us.
const TABLE: &str = "kbdbtest.items";

#[cfg(feature = "backend-sqlite")]
fn settings() -> (db::DbSettings, tempfile::TempDir) {
    let dir = tempfile::tempdir().expect("tempdir");
    let s = db::DbSettings {
        url: None,
        host: None,
        port: None,
        user: None,
        password: None,
        database: None,
        path: Some(dir.path().to_string_lossy().into_owned()),
        max_connections: 4,
        min_connections: 0,
        connect_timeout: std::time::Duration::from_secs(10),
        run_migrations: false,
    };
    (s, dir)
}

#[cfg(not(feature = "backend-sqlite"))]
fn settings() -> (db::DbSettings, ()) {
    let url = std::env::var("KUBUNO_DB_TEST_URL").expect(
        "set KUBUNO_DB_TEST_URL to a throwaway database for this engine \
         (see the module docs at the top of this file)",
    );
    let s = db::DbSettings {
        url: Some(url),
        host: None,
        port: None,
        user: None,
        password: None,
        database: None,
        path: None,
        max_connections: 4,
        min_connections: 0,
        connect_timeout: std::time::Duration::from_secs(10),
        run_migrations: false,
    };
    (s, ())
}

/// Per-engine DDL, written the way a module's three migration files would be.
fn create_table_sql() -> String {
    format!(
        "CREATE TABLE IF NOT EXISTS {TABLE} (
             id          {uuid} NOT NULL PRIMARY KEY,
             owner_id    {uuid} NOT NULL,
             name        VARCHAR(190) NOT NULL UNIQUE,
             size_bytes  BIGINT NOT NULL DEFAULT 0,
             revision    BIGINT NOT NULL DEFAULT 1,
             meta        {json},
             created_at  {ts} NOT NULL
         )",
        uuid = column::uuid(),
        json = column::json(),
        ts = column::timestamptz(),
    )
}

/// PostgreSQL and MySQL tests share one server-side namespace, so they must not
/// create and drop the same table at the same time. SQLite gets a fresh
/// temporary directory per test and would not need this, but one rule for the
/// three engines is easier to keep true.
static EXCLUSIVE: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());

async fn fresh_pool() -> (db::DbPool, impl Sized) {
    let guard = EXCLUSIVE.lock().await;
    let (settings, keep) = settings();
    let pool = db::connect(&settings, SCHEMA).await.expect("connect");
    // A previous run may have left the table behind.
    db::query(&format!("DROP TABLE IF EXISTS {TABLE}"))
        .expect("drop sql")
        .execute(&pool)
        .await
        .expect("drop");
    db::query(&create_table_sql())
        .expect("create sql")
        .execute(&pool)
        .await
        .expect("create");
    (pool, (keep, guard))
}

/// The three types `sqlx::Any` cannot carry, which is the whole reason this
/// crate exists: they must survive a round trip on every engine.
#[tokio::test]
async fn uuid_json_and_timestamp_survive_a_round_trip() {
    let (pool, _keep) = fresh_pool().await;

    let id = db::new_id();
    let owner = db::new_id();
    let created: DateTime<Utc> = Utc::now();
    let meta = serde_json::json!({ "kind": "vault", "nested": { "n": 7 } });

    db::query(&format!(
        "INSERT INTO {TABLE} (id, owner_id, name, size_bytes, meta, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6)"
    ))
    .unwrap()
    .bind(id)
    .bind(owner)
    .bind("first")
    .bind(1024_i64)
    .bind(&meta)
    .bind(created)
    .execute(&pool)
    .await
    .expect("insert");

    let row = db::query(&format!(
        "SELECT id, owner_id, size_bytes, meta, created_at FROM {TABLE} WHERE id = $1"
    ))
    .unwrap()
    .bind(id)
    .fetch_one(&pool)
    .await
    .expect("select");

    assert_eq!(row.try_get::<Uuid, _>("id").unwrap(), id);
    assert_eq!(row.try_get::<Uuid, _>("owner_id").unwrap(), owner);
    assert_eq!(row.try_get::<i64, _>("size_bytes").unwrap(), 1024);
    assert_eq!(row.try_get::<serde_json::Value, _>("meta").unwrap(), meta);

    let back: DateTime<Utc> = row.try_get("created_at").unwrap();
    // SQLite stores microseconds as text and MySQL's DATETIME(6) also stops
    // there, so compare at millisecond resolution.
    assert!(
        (back - created).num_milliseconds().abs() < 2,
        "{back} vs {created}"
    );
}

/// The placeholder rewriting itself: several binds, in order, on one statement.
#[tokio::test]
async fn placeholders_line_up_with_their_binds() {
    let (pool, _keep) = fresh_pool().await;
    let owner = db::new_id();

    for (i, name) in ["a", "b", "c"].iter().enumerate() {
        db::query(&format!(
            "INSERT INTO {TABLE} (id, owner_id, name, size_bytes, created_at) \
             VALUES ($1, $2, $3, $4, $5)"
        ))
        .unwrap()
        .bind(db::new_id())
        .bind(owner)
        .bind(*name)
        .bind((i as i64 + 1) * 100)
        .bind(Utc::now())
        .execute(&pool)
        .await
        .expect("insert");
    }

    // `= ANY($2)` has no equivalent outside PostgreSQL: dialect::in_list is the
    // portable replacement, and it must keep the numbering consistent.
    let wanted = ["a", "c"];
    let sql = format!(
        "SELECT name FROM {TABLE} WHERE owner_id = $1 AND name IN ({}) ORDER BY name",
        dialect::in_list(2, wanted.len())
    );
    let mut q = db::query(&sql).unwrap().bind(owner);
    for w in &wanted {
        q = q.bind(*w);
    }
    let names: Vec<String> = q
        .fetch_all(&pool)
        .await
        .expect("select")
        .iter()
        .map(|r| r.try_get::<String, _>("name").unwrap())
        .collect();
    assert_eq!(names, vec!["a".to_string(), "c".to_string()]);
}

#[tokio::test]
async fn an_empty_in_list_matches_nothing() {
    let (pool, _keep) = fresh_pool().await;
    let sql = format!(
        "SELECT name FROM {TABLE} WHERE name IN ({})",
        dialect::in_list(1, 0)
    );
    let rows = db::query(&sql).unwrap().fetch_all(&pool).await.expect("select");
    assert!(rows.is_empty());
}

/// Upsert plus `RETURNING`, i.e. the exact shape of keestore's `PUT /kdbx`.
#[tokio::test]
async fn upsert_bumps_a_counter_and_gives_it_back() {
    let (pool, _keep) = fresh_pool().await;
    let id = db::new_id();
    let owner = db::new_id();
    let mut conn = pool.acquire().await.expect("acquire");

    let insert = format!(
        "INSERT INTO {TABLE} (id, owner_id, name, size_bytes, revision, created_at) \
         VALUES ($1, $2, $3, $4, 1, $5){}",
        dialect::upsert(
            "items",
            &["name"],
            &[
                Assign::Incoming("size_bytes"),
                Assign::Expr { col: "revision", expr: "{cur} + 1" },
            ],
        )
    );
    // On MySQL the row is found again by its natural key, since a conflicting
    // insert keeps the *existing* id.
    let reselect = format!("SELECT revision FROM {TABLE} WHERE name = $1");

    for expected in 1..=3_i64 {
        let revision: i64 = db::returning::insert_returning_scalar(
            &mut conn,
            &insert,
            "revision",
            |q| {
                q.bind(id)
                    .bind(owner)
                    .bind("same-name")
                    .bind(expected * 10)
                    .bind(Utc::now())
            },
            &reselect,
            |q| q.bind("same-name"),
        )
        .await
        .expect("upsert");
        assert_eq!(revision, expected, "revision should climb on each upsert");
    }

    let count: i64 = db::query_scalar(&format!(
        "SELECT {} FROM {TABLE}",
        dialect::count_bigint("*")
    ))
    .unwrap()
    .fetch_one(&pool)
    .await
    .expect("count");
    assert_eq!(count, 1, "the upsert must not have created a second row");
}

/// Aggregates return a different SQL type on each engine; the dialect layer
/// has to make them all decode into `i64`/`f64`.
#[tokio::test]
async fn aggregates_decode_on_every_engine() {
    let (pool, _keep) = fresh_pool().await;
    let owner = db::new_id();
    for (i, name) in ["x", "y"].iter().enumerate() {
        db::query(&format!(
            "INSERT INTO {TABLE} (id, owner_id, name, size_bytes, created_at) \
             VALUES ($1, $2, $3, $4, $5)"
        ))
        .unwrap()
        .bind(db::new_id())
        .bind(owner)
        .bind(*name)
        .bind((i as i64 + 1) * 1000)
        .bind(Utc::now())
        .execute(&pool)
        .await
        .expect("insert");
    }

    let sql = format!(
        "SELECT {sum} AS total, {count} AS n, {avg} AS mean FROM {TABLE} WHERE owner_id = $1",
        sum = dialect::sum_bigint("size_bytes"),
        count = dialect::count_bigint("*"),
        avg = dialect::avg_double("size_bytes"),
    );
    let row = db::query(&sql).unwrap().bind(owner).fetch_one(&pool).await.expect("aggregate");
    assert_eq!(row.try_get::<i64, _>("total").unwrap(), 3000);
    assert_eq!(row.try_get::<i64, _>("n").unwrap(), 2);
    assert!((row.try_get::<f64, _>("mean").unwrap() - 1500.0).abs() < 0.001);

    // SUM over no rows must be 0, not NULL.
    let empty: i64 = db::query_scalar(&format!(
        "SELECT {} FROM {TABLE} WHERE owner_id = $1",
        dialect::sum_bigint("size_bytes")
    ))
    .unwrap()
    .bind(db::new_id())
    .fetch_one(&pool)
    .await
    .expect("empty sum");
    assert_eq!(empty, 0);
}

#[tokio::test]
async fn json_accessors_read_the_same_value_everywhere() {
    let (pool, _keep) = fresh_pool().await;
    let id = db::new_id();
    db::query(&format!(
        "INSERT INTO {TABLE} (id, owner_id, name, meta, created_at) VALUES ($1, $2, $3, $4, $5)"
    ))
    .unwrap()
    .bind(id)
    .bind(db::new_id())
    .bind("json")
    .bind(serde_json::json!({ "kind": "vault", "nested": { "n": "deep" } }))
    .bind(Utc::now())
    .execute(&pool)
    .await
    .expect("insert");

    let kind: String = db::query_scalar(&format!(
        "SELECT {} FROM {TABLE} WHERE id = $1",
        dialect::json_text("meta", &["kind"])
    ))
    .unwrap()
    .bind(id)
    .fetch_one(&pool)
    .await
    .expect("json_text");
    assert_eq!(kind, "vault");

    let deep: String = db::query_scalar(&format!(
        "SELECT {} FROM {TABLE} WHERE id = $1",
        dialect::json_text("meta", &["nested", "n"])
    ))
    .unwrap()
    .bind(id)
    .fetch_one(&pool)
    .await
    .expect("nested json_text");
    assert_eq!(deep, "deep");

    // Replaces PostgreSQL's `?` operator, which `prepare` refuses.
    let has: bool = db::query_scalar(&format!(
        "SELECT {} FROM {TABLE} WHERE id = $1",
        dialect::json_has_key("meta", "kind")
    ))
    .unwrap()
    .bind(id)
    .fetch_one(&pool)
    .await
    .expect("json_has_key");
    assert!(has);
}

#[tokio::test]
async fn casts_translate() {
    let (pool, _keep) = fresh_pool().await;
    let as_text: String = db::query_scalar(&format!("SELECT {}", dialect::cast("42", SqlType::Text)))
        .unwrap()
        .fetch_one(&pool)
        .await
        .expect("cast to text");
    assert_eq!(as_text, "42");
}

/// Delete-and-return, whose MySQL emulation has to read *before* it writes.
#[tokio::test]
async fn delete_returns_what_it_removed() {
    let (pool, _keep) = fresh_pool().await;
    let id = db::new_id();
    db::query(&format!(
        "INSERT INTO {TABLE} (id, owner_id, name, size_bytes, created_at) \
         VALUES ($1, $2, $3, $4, $5)"
    ))
    .unwrap()
    .bind(id)
    .bind(db::new_id())
    .bind("doomed")
    .bind(77_i64)
    .bind(Utc::now())
    .execute(&pool)
    .await
    .expect("insert");

    let mut tx = pool.begin().await.expect("begin");
    let row = db::returning::delete_returning_row(
        &mut tx,
        &format!("DELETE FROM {TABLE} WHERE id = $1"),
        "size_bytes",
        |q| q.bind(id),
        &db::returning::reselect_by_id(TABLE, "size_bytes"),
        |q| q.bind(id),
    )
    .await
    .expect("delete returning")
    .expect("a row");
    assert_eq!(row.try_get::<i64, _>("size_bytes").unwrap(), 77);
    tx.commit().await.expect("commit");

    let left: i64 = db::query_scalar(&format!(
        "SELECT {} FROM {TABLE} WHERE id = $1",
        dialect::count_bigint("*")
    ))
    .unwrap()
    .bind(id)
    .fetch_one(&pool)
    .await
    .expect("count");
    assert_eq!(left, 0);
}

/// `pg_notify` where it exists, an outbox row where it does not.
#[tokio::test]
async fn events_are_publishable() {
    let (pool, _keep) = fresh_pool().await;
    db::events::ensure_outbox(&pool, SCHEMA).await.expect("outbox ddl");
    db::events::notify(&pool, SCHEMA, db::events::CHANNEL, r#"{"type":"test"}"#)
        .await
        .expect("notify");

    if db::BACKEND != db::Backend::Postgres {
        let n: i64 = db::query_scalar(&format!(
            "SELECT {} FROM {SCHEMA}.kubuno_event_outbox",
            dialect::count_bigint("*")
        ))
        .unwrap()
        .fetch_one(&pool)
        .await
        .expect("count outbox");
        assert_eq!(n, 1);
        db::query(&format!("DROP TABLE {SCHEMA}.kubuno_event_outbox"))
            .unwrap()
            .execute(&pool)
            .await
            .expect("cleanup");
    }
}
