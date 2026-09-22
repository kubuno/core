//! Real, cross-engine integration matrix for the two administrative schema
//! operations that back the database console:
//!
//! * **#3 — engine switch by data copy** ([`copy_schema`]): every ordered pair
//!   `(src, dst)` of the available engines is exercised on a rich schema (uuid,
//!   timestamptz, json, bool, int4/int8, bytea/blob, JSON-encoded arrays, text,
//!   NULLs, two tables with a foreign key). Each case verifies row counts,
//!   pointwise value fidelity, and that the source is left untouched.
//! * **#2 — schema-prefix rename** ([`rename_schema_prefix`] /
//!   [`discover_prefixed_schemas`]): a miniature instance (core + a primary
//!   module + its *secondary* schemas `office_data/maths/script/wb` + the two
//!   newly-added `build`/`stt`, plus a non-Kubuno schema left alone) is renamed
//!   through a chain of prefixes; every transition proves that primary AND
//!   secondary Kubuno schemas move together and foreign schemas do not. This is
//!   the direct regression for the discovery bug that skipped secondary schemas.
//!
//! # Engine availability
//!
//! SQLite is embedded, so its cases always run. PostgreSQL runs when
//! `KUBUNO_PG_TEST_URL` is set; MySQL/MariaDB when `KUBUNO_MYSQL_TEST_URL` is.
//! An unavailable engine's cases print a notice and return, so a bare CI stays
//! green.
//!
//! # Isolation & safety
//!
//! * PostgreSQL: every case runs inside a throwaway `CREATE DATABASE
//!   kubuno_switchtest_*`, dropped at the end, so nothing touches shared data and
//!   the prefix chain — including the bare (`''`) prefix — is safe.
//! * MySQL: a database *is* a schema server-wide, and this server already holds
//!   real bare-named Kubuno databases (`core`, `office`, …). The prefix chain
//!   therefore uses only unique, non-colliding prefixes (never the bare `''`),
//!   which still exercises the fixed discovery path (secondary schemas) without
//!   risking a real database. Copies use throwaway `kubuno_switchtest_*`
//!   databases.

use chrono::{DateTime, NaiveDate, NaiveDateTime, TimeZone, Utc};
use kubuno_db::{
    connect, copy_schema, discover_prefixed_schemas, params, rename_schema_prefix, Backend, DbPool,
    DbSettings,
};

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures & helpers
// ─────────────────────────────────────────────────────────────────────────────

/// A self-deleting temp directory for SQLite files.
struct TempDir(std::path::PathBuf);
impl TempDir {
    fn new() -> Self {
        let p = std::env::temp_dir().join(format!("kubuno-switchmx-{}", uuid::Uuid::new_v4()));
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
        "engine": engine,
        "max_connections": 4,
        "min_connections": 0,
        "connect_timeout": 15,
        "run_migrations": false,
    });
    base.as_object_mut()
        .unwrap()
        .extend(extra.as_object().unwrap().clone());
    serde_json::from_value(base).expect("DbSettings")
}

fn pg_base_url() -> Option<String> {
    std::env::var("KUBUNO_PG_TEST_URL").ok().filter(|u| !u.trim().is_empty())
}
fn mysql_base_url() -> Option<String> {
    std::env::var("KUBUNO_MYSQL_TEST_URL").ok().filter(|u| !u.trim().is_empty())
}

/// A short, unique, lowercase identifier fragment for throwaway names.
fn tag() -> String {
    uuid::Uuid::new_v4().simple().to_string()[..10].to_string()
}

/// Swaps the database segment of a `postgres://…/<db>` URL.
fn pg_url_with_db(base: &str, db: &str) -> String {
    let (prefix, _old) = base.rsplit_once('/').expect("url has a database segment");
    format!("{prefix}/{db}")
}

/// A connected pool plus the effective schema name to operate under, and enough
/// to tear the throwaway namespace down afterwards.
struct Scope {
    pool: DbPool,
    schema: String,
    /// `(admin_pool, database_name)` for a throwaway server database to drop, if
    /// any (PostgreSQL and MySQL); `None` for SQLite (the `TempDir` cleans up).
    drop_db: Option<(DbPool, String)>,
}

impl Scope {
    async fn cleanup(self) {
        if let Some((admin, db)) = self.drop_db {
            match admin.backend() {
                Backend::Postgres => {
                    // WITH (FORCE) evicts any lingering connection (PostgreSQL 16).
                    let _ = admin
                        .execute(&format!("DROP DATABASE IF EXISTS \"{db}\" WITH (FORCE)"), params![])
                        .await;
                }
                Backend::MySql => {
                    let _ = admin
                        .execute(&format!("DROP DATABASE IF EXISTS \"{db}\""), params![])
                        .await;
                }
                Backend::Sqlite => {}
            }
        }
    }
}

/// Opens a throwaway PostgreSQL database and returns a pool bound to schema `s`.
async fn open_pg() -> Scope {
    let base = pg_base_url().expect("KUBUNO_PG_TEST_URL");
    let db = format!("kubuno_switchtest_cpy_{}", tag());
    let admin = connect(&settings("postgres", serde_json::json!({ "url": base.clone() })), "public")
        .await
        .expect("pg admin connect");
    admin
        .execute(&format!("CREATE DATABASE \"{db}\""), params![])
        .await
        .expect("create scratch pg db");
    let url = pg_url_with_db(&base, &db);
    let pool = connect(&settings("postgres", serde_json::json!({ "url": url })), "s")
        .await
        .expect("pg scratch connect");
    Scope { pool, schema: "s".to_string(), drop_db: Some((admin, db)) }
}

/// Opens a throwaway MySQL database (its name doubles as the schema, since a
/// MySQL database *is* a schema). The database must be created through the admin
/// pool first: a MySQL connection opens *against* a named database, so it cannot
/// itself create the one it connects to.
async fn open_mysql() -> Scope {
    let base = mysql_base_url().expect("KUBUNO_MYSQL_TEST_URL");
    let db = format!("kubuno_switchtest_cpy_{}", tag());
    let admin = connect(&settings("mysql", serde_json::json!({ "url": base.clone() })), "mysql")
        .await
        .expect("mysql admin connect");
    admin
        .execute(&format!("CREATE DATABASE \"{db}\""), params![])
        .await
        .expect("create scratch mysql db");
    // `connect` wants a `&'static str` schema; leak the throwaway name once.
    let leaked: &'static str = Box::leak(db.clone().into_boxed_str());
    let pool = connect(&settings("mysql", serde_json::json!({ "url": base })), leaked)
        .await
        .expect("mysql scratch connect");
    Scope { pool, schema: db.clone(), drop_db: Some((admin, db)) }
}

/// Opens a SQLite pool over a file named after `schema` inside `dir`.
async fn open_sqlite(dir: &str, schema: &'static str) -> Scope {
    let pool = connect(&settings("sqlite", serde_json::json!({ "path": dir })), schema)
        .await
        .expect("sqlite connect");
    Scope { pool, schema: schema.to_string(), drop_db: None }
}

// ── the rich demo schema ─────────────────────────────────────────────────────

/// The reference timestamp, with microseconds so precision is part of the test.
fn created_ref() -> DateTime<Utc> {
    Utc.with_ymd_and_hms(2024, 3, 15, 12, 34, 56).unwrap() + chrono::Duration::microseconds(123_456)
}
fn created2_ref() -> DateTime<Utc> {
    Utc.with_ymd_and_hms(2020, 1, 2, 3, 4, 5).unwrap()
}
fn born_ref() -> NaiveDate {
    NaiveDate::from_ymd_opt(1990, 5, 20).unwrap()
}
fn a1_id() -> uuid::Uuid {
    uuid::Uuid::parse_str("11111111-1111-4111-8111-111111111111").unwrap()
}
fn a2_id() -> uuid::Uuid {
    uuid::Uuid::parse_str("22222222-2222-4222-8222-222222222222").unwrap()
}
fn meta_ref() -> serde_json::Value {
    serde_json::json!({ "k": 3, "s": "héllo", "b": true })
}
fn tags_ref() -> serde_json::Value {
    serde_json::json!(["x", "y", "z"])
}
fn avatar_ref() -> Vec<u8> {
    vec![1u8, 2, 3, 4, 255, 0, 16]
}

/// Creates `people` (parent) and `posts` (child, FK → people) with the richest
/// types each engine offers. SQLite declares only storage classes on purpose:
/// that is what makes a copy *out of* SQLite unable to re-derive `boolean`/`uuid`
/// on a strict destination — the documented fidelity caveat.
///
/// `with_json` includes the two JSON columns. It is left out for the MySQL→
/// PostgreSQL direction because MariaDB reports a `JSON` column as `LONGTEXT` in
/// its catalog (it has no distinct JSON type), so the generic copy reads it as
/// text and a strict PostgreSQL `jsonb` destination rejects it — a MariaDB-
/// specific fidelity caveat covered by its own dedicated test.
async fn create_rich(pool: &DbPool, schema: &str, with_json: bool) {
    let json_cols = match (pool.backend(), with_json) {
        (_, false) => "",
        (Backend::Postgres, true) => "meta jsonb, tags jsonb, ",
        (Backend::MySql, true) => "meta json, tags json, ",
        (Backend::Sqlite, true) => "meta TEXT, tags TEXT, ",
    };
    let (people, posts) = match pool.backend() {
        Backend::Postgres => (
            format!(
                "CREATE TABLE \"{schema}\".\"people\" (\
                    id uuid PRIMARY KEY, name text NOT NULL, nickname text, \
                    active boolean NOT NULL, rank integer, big bigint, score double precision, \
                    {json_cols}avatar bytea, born date, created timestamptz NOT NULL)"
            ),
            format!(
                "CREATE TABLE \"{schema}\".\"posts\" (\
                    id uuid PRIMARY KEY, \
                    author uuid NOT NULL REFERENCES \"{schema}\".\"people\"(id), \
                    title text NOT NULL, views bigint)"
            ),
        ),
        Backend::MySql => (
            format!(
                "CREATE TABLE \"{schema}\".\"people\" (\
                    id binary(16) PRIMARY KEY, name text NOT NULL, nickname text, \
                    active tinyint(1) NOT NULL, rank int, big bigint, score double, \
                    {json_cols}avatar blob, born date, created datetime(6) NOT NULL)"
            ),
            format!(
                "CREATE TABLE \"{schema}\".\"posts\" (\
                    id binary(16) PRIMARY KEY, author binary(16) NOT NULL, \
                    title text NOT NULL, views bigint, \
                    FOREIGN KEY (author) REFERENCES \"{schema}\".\"people\"(id))"
            ),
        ),
        Backend::Sqlite => (
            format!(
                "CREATE TABLE \"{schema}\".\"people\" (\
                    id BLOB PRIMARY KEY, name TEXT NOT NULL, nickname TEXT, \
                    active INTEGER NOT NULL, rank INTEGER, big INTEGER, score REAL, \
                    {json_cols}avatar BLOB, born TEXT, created TEXT NOT NULL)"
            ),
            format!(
                "CREATE TABLE \"{schema}\".\"posts\" (\
                    id BLOB PRIMARY KEY, \
                    author BLOB NOT NULL REFERENCES \"people\"(id), \
                    title TEXT NOT NULL, views INTEGER)"
            ),
        ),
    };
    pool.execute(&people, params![]).await.expect("create people");
    pool.execute(&posts, params![]).await.expect("create posts");
}

/// Seeds two people (the second carrying NULL nickname and NULL score) and three
/// posts (the last with a NULL `views`), so NULL handling is copied too.
async fn seed(pool: &DbPool, schema: &str, with_json: bool) {
    let (json_names, json_a1, json_a2): (&str, Vec<kubuno_db::DbValue>, Vec<kubuno_db::DbValue>) =
        if with_json {
            (
                "meta, tags, ",
                params![meta_ref(), tags_ref()],
                params![serde_json::json!({ "empty": true }), serde_json::json!([])],
            )
        } else {
            ("", params![], params![])
        };

    // Placeholders renumber depending on whether the two JSON columns are present.
    let placeholders = if with_json {
        "$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12"
    } else {
        "$1,$2,$3,$4,$5,$6,$7,$8,$9,$10"
    };
    let insert_person = format!(
        "INSERT INTO \"{schema}\".\"people\" \
            (id, name, nickname, active, rank, big, score, {json_names}avatar, born, created) \
         VALUES ({placeholders})"
    );
    // a1: every column populated.
    let mut a1 = params![
        a1_id(),
        "Ada",
        Some("ada"),
        true,
        42_i32,
        9_000_000_000_i64,
        Some(3.5_f64)
    ];
    a1.extend(json_a1);
    a1.extend(params![avatar_ref(), born_ref(), created_ref()]);
    pool.execute(&insert_person, a1).await.expect("insert a1");

    // a2: NULL nickname and NULL score.
    let mut a2 = params![
        a2_id(),
        "Alan",
        None::<&str>,
        false,
        7_i32,
        -5_i64,
        None::<f64>
    ];
    a2.extend(json_a2);
    a2.extend(params![
        Vec::<u8>::new(),
        NaiveDate::from_ymd_opt(2000, 1, 1).unwrap(),
        created2_ref()
    ]);
    pool.execute(&insert_person, a2).await.expect("insert a2");

    let insert_post = format!(
        "INSERT INTO \"{schema}\".\"posts\" (id, author, title, views) VALUES ($1,$2,$3,$4)"
    );
    for (title, author, views) in [
        ("Book A", a1_id(), Some(100_i64)),
        ("Book B", a1_id(), Some(200_i64)),
        ("Book C", a2_id(), None::<i64>),
    ] {
        pool.execute(&insert_post, params![uuid::Uuid::new_v4(), author, title, views])
            .await
            .expect("insert post");
    }
}

async fn count(pool: &DbPool, schema: &str, table: &str) -> i64 {
    pool.fetch_scalar::<i64>(
        &format!("SELECT COUNT(*) FROM \"{schema}\".\"{table}\""),
        params![],
    )
    .await
    .expect("count")
}

/// Reads one `people` column of a named row.
async fn person_col<T: kubuno_db::exec::ScalarAnyRow>(
    pool: &DbPool,
    schema: &str,
    col: &str,
    who: &str,
) -> T {
    pool.fetch_scalar::<T>(
        &format!("SELECT \"{col}\" FROM \"{schema}\".\"people\" WHERE \"name\" = $1"),
        params![who],
    )
    .await
    .unwrap_or_else(|e| panic!("read {col} of {who}: {e}"))
}

/// Full pointwise fidelity check, run only for directions the copy is exact on
/// (a richly-typed source, or SQLite→SQLite). Timestamps and dates are read at
/// the type the destination engine decodes them as.
async fn verify_faithful(dst: &DbPool, schema: &str, with_json: bool) {
    // uuid, text, bool, bigint, bytea — portable to read on all three engines.
    assert_eq!(person_col::<uuid::Uuid>(dst, schema, "id", "Ada").await, a1_id(), "uuid");
    assert_eq!(person_col::<String>(dst, schema, "name", "Ada").await, "Ada", "text");
    assert!(person_col::<bool>(dst, schema, "active", "Ada").await, "bool true");
    assert!(!person_col::<bool>(dst, schema, "active", "Alan").await, "bool false");
    assert_eq!(person_col::<i64>(dst, schema, "big", "Ada").await, 9_000_000_000, "int8");
    assert_eq!(person_col::<i64>(dst, schema, "big", "Alan").await, -5, "int8 negative");
    assert_eq!(person_col::<Vec<u8>>(dst, schema, "avatar", "Ada").await, avatar_ref(), "bytea");

    // json — the object and the array both round-trip as a value.
    if with_json {
        assert_eq!(
            person_col::<serde_json::Value>(dst, schema, "meta", "Ada").await,
            meta_ref(),
            "jsonb object"
        );
        assert_eq!(
            person_col::<serde_json::Value>(dst, schema, "tags", "Ada").await,
            tags_ref(),
            "jsonb array"
        );
    }

    // NULLs survive as NULLs (typed None read).
    assert!(
        person_col::<Option<String>>(dst, schema, "nickname", "Alan").await.is_none(),
        "NULL nickname"
    );
    assert!(
        person_col::<Option<f64>>(dst, schema, "score", "Alan").await.is_none(),
        "NULL score"
    );

    // timestamp — PostgreSQL/SQLite decode UTC directly; MySQL DATETIME is naive.
    match dst.backend() {
        Backend::Postgres | Backend::Sqlite => {
            assert_eq!(
                person_col::<DateTime<Utc>>(dst, schema, "created", "Ada").await,
                created_ref(),
                "timestamptz"
            );
        }
        Backend::MySql => {
            assert_eq!(
                person_col::<NaiveDateTime>(dst, schema, "created", "Ada").await,
                created_ref().naive_utc(),
                "datetime(6)"
            );
        }
    }
    assert_eq!(person_col::<NaiveDate>(dst, schema, "born", "Ada").await, born_ref(), "date");
}

/// The whole copy flow: seed the source, copy into the (empty) destination,
/// verify counts on both sides, prove the source is untouched, and — when
/// `faithful` — check pointwise fidelity. Returns nothing; panics on mismatch.
async fn run_copy(src: &Scope, dst: &Scope, faithful: bool, with_json: bool) {
    seed(&src.pool, &src.schema, with_json).await;
    assert_eq!(count(&src.pool, &src.schema, "people").await, 2);
    assert_eq!(count(&src.pool, &src.schema, "posts").await, 3);

    let mut steps = Vec::new();
    let report = copy_schema(&src.pool, &src.schema, &dst.pool, &dst.schema, &mut |t, total| {
        steps.push((t.to_string(), total));
    })
    .await
    .expect("copy_schema");

    assert_eq!(report.total_rows, 5, "2 people + 3 posts");
    assert!(steps.iter().any(|(t, _)| t == "people"));
    assert!(steps.iter().any(|(t, _)| t == "posts"));
    assert_eq!(count(&dst.pool, &dst.schema, "people").await, 2, "people copied");
    assert_eq!(count(&dst.pool, &dst.schema, "posts").await, 3, "posts copied");

    // The source is never mutated by a copy.
    assert_eq!(count(&src.pool, &src.schema, "people").await, 2, "source people intact");
    assert_eq!(count(&src.pool, &src.schema, "posts").await, 3, "source posts intact");

    if faithful {
        verify_faithful(&dst.pool, &dst.schema, with_json).await;
    }

    // Re-running is idempotent (destination emptied first, counts unchanged).
    copy_schema(&src.pool, &src.schema, &dst.pool, &dst.schema, &mut |_, _| {})
        .await
        .expect("second copy_schema");
    assert_eq!(count(&dst.pool, &dst.schema, "people").await, 2, "still 2 after re-copy");
}

// ─────────────────────────────────────────────────────────────────────────────
// #3 — copy matrix
// ─────────────────────────────────────────────────────────────────────────────

// SQLite → SQLite (always runs) ------------------------------------------------

#[tokio::test]
async fn copy_sqlite_to_sqlite() {
    let dir = TempDir::new();
    let src = open_sqlite(dir.str(), "srcs").await;
    let dst = open_sqlite(dir.str(), "dsts").await;
    create_rich(&src.pool, &src.schema, true).await;
    create_rich(&dst.pool, &dst.schema, true).await;
    // SQLite → SQLite is exact: storage classes are preserved verbatim.
    run_copy(&src, &dst, true, true).await;
    src.cleanup().await;
    dst.cleanup().await;
}

// PostgreSQL (guarded) ---------------------------------------------------------

#[tokio::test]
async fn copy_pg_to_pg() {
    if pg_base_url().is_none() {
        eprintln!("KUBUNO_PG_TEST_URL non défini — copy_pg_to_pg ignoré");
        return;
    }
    let src = open_pg().await;
    let dst = open_pg().await;
    create_rich(&src.pool, &src.schema, true).await;
    create_rich(&dst.pool, &dst.schema, true).await;
    run_copy(&src, &dst, true, true).await;
    src.cleanup().await;
    dst.cleanup().await;
}

#[tokio::test]
async fn copy_pg_to_sqlite() {
    if pg_base_url().is_none() {
        eprintln!("KUBUNO_PG_TEST_URL non défini — copy_pg_to_sqlite ignoré");
        return;
    }
    let src = open_pg().await;
    let dir = TempDir::new();
    let dst = open_sqlite(dir.str(), "psq").await;
    create_rich(&src.pool, &src.schema, true).await;
    create_rich(&dst.pool, &dst.schema, true).await;
    // A PostgreSQL source is richly typed, so uuid/bool/json/timestamp copy
    // faithfully into SQLite's storage classes.
    run_copy(&src, &dst, true, true).await;
    src.cleanup().await;
    dst.cleanup().await;
}

#[tokio::test]
async fn copy_sqlite_to_pg_documents_the_caveat() {
    if pg_base_url().is_none() {
        eprintln!("KUBUNO_PG_TEST_URL non défini — copy_sqlite_to_pg ignoré");
        return;
    }
    let dir = TempDir::new();
    let src = open_sqlite(dir.str(), "sqp").await;
    let dst = open_pg().await;
    create_rich(&src.pool, &src.schema, true).await;
    create_rich(&dst.pool, &dst.schema, true).await;
    seed(&src.pool, &src.schema, true).await;

    // The documented fidelity limit: SQLite stored the uuid as BLOB and the bool
    // as INTEGER, so copying into a strict PostgreSQL `uuid`/`boolean` column
    // cannot re-derive those types — the copy fails *safely* (an error, not a
    // silent mis-store) and the destination transaction rolls back, leaving it
    // empty. This proves the limitation is a hard, visible boundary.
    let result = copy_schema(&src.pool, &src.schema, &dst.pool, &dst.schema, &mut |_, _| {}).await;
    assert!(
        result.is_err(),
        "SQLite→PostgreSQL of a bool/uuid column must fail rather than mis-store; got {result:?}"
    );
    assert_eq!(count(&dst.pool, &dst.schema, "people").await, 0, "destination rolled back");
    // The source is untouched by the failed attempt.
    assert_eq!(count(&src.pool, &src.schema, "people").await, 2, "source intact after failure");
    eprintln!("SQLite→PostgreSQL caveat confirmed (safe failure): {:?}", result.err());

    src.cleanup().await;
    dst.cleanup().await;
}

// MySQL (guarded) --------------------------------------------------------------

#[tokio::test]
async fn copy_mysql_to_mysql() {
    if mysql_base_url().is_none() {
        eprintln!("KUBUNO_MYSQL_TEST_URL non défini — copy_mysql_to_mysql ignoré");
        return;
    }
    let src = open_mysql().await;
    let dst = open_mysql().await;
    create_rich(&src.pool, &src.schema, true).await;
    create_rich(&dst.pool, &dst.schema, true).await;
    run_copy(&src, &dst, true, true).await;
    src.cleanup().await;
    dst.cleanup().await;
}

#[tokio::test]
async fn copy_pg_to_mysql() {
    if pg_base_url().is_none() || mysql_base_url().is_none() {
        eprintln!("PG ou MySQL non défini — copy_pg_to_mysql ignoré");
        return;
    }
    let src = open_pg().await;
    let dst = open_mysql().await;
    create_rich(&src.pool, &src.schema, true).await;
    create_rich(&dst.pool, &dst.schema, true).await;
    run_copy(&src, &dst, true, true).await;
    src.cleanup().await;
    dst.cleanup().await;
}

#[tokio::test]
async fn copy_mysql_to_pg() {
    if pg_base_url().is_none() || mysql_base_url().is_none() {
        eprintln!("PG ou MySQL non défini — copy_mysql_to_pg ignoré");
        return;
    }
    let src = open_mysql().await;
    let dst = open_pg().await;
    // JSON columns are excluded here: on MariaDB a `JSON` column is reported as
    // `LONGTEXT` in the catalog, so the generic copy reads it as text and a
    // strict PostgreSQL `jsonb` destination rejects it. That MariaDB-specific
    // caveat has its own test below; the distinctly-typed columns
    // (uuid/bool/timestamp/int/bytea) copy out of MySQL into PostgreSQL exactly.
    create_rich(&src.pool, &src.schema, false).await;
    create_rich(&dst.pool, &dst.schema, false).await;
    run_copy(&src, &dst, true, false).await;
    src.cleanup().await;
    dst.cleanup().await;
}

/// Documents the MariaDB `JSON`→PostgreSQL `jsonb` fidelity caveat directly: a
/// MariaDB `JSON` column is catalog-indistinguishable from `LONGTEXT`, so the
/// generic copy carries it as text, which a strict `jsonb` destination rejects.
/// The copy fails safely (an error, empty destination) rather than mis-storing.
#[tokio::test]
async fn copy_mariadb_json_into_pg_jsonb_caveat() {
    if pg_base_url().is_none() || mysql_base_url().is_none() {
        eprintln!("PG ou MySQL non défini — copy_mariadb_json_caveat ignoré");
        return;
    }
    let src = open_mysql().await;
    let dst = open_pg().await;
    // Only a JSON source (MariaDB longtext) → jsonb destination pair, minimal.
    src.pool
        .execute(
            &format!("CREATE TABLE \"{}\".\"j\" (id int PRIMARY KEY, meta json)", src.schema),
            params![],
        )
        .await
        .expect("create mysql j");
    src.pool
        .execute(
            &format!("INSERT INTO \"{}\".\"j\" (id, meta) VALUES ($1,$2)", src.schema),
            params![1_i32, meta_ref()],
        )
        .await
        .expect("seed mysql j");
    dst.pool
        .execute(
            &format!("CREATE TABLE \"{}\".\"j\" (id int PRIMARY KEY, meta jsonb)", dst.schema),
            params![],
        )
        .await
        .expect("create pg j");

    let result = copy_schema(&src.pool, &src.schema, &dst.pool, &dst.schema, &mut |_, _| {}).await;
    assert!(
        result.is_err(),
        "MariaDB JSON→PostgreSQL jsonb must fail rather than mis-store; got {result:?}"
    );
    let n: i64 = dst
        .pool
        .fetch_scalar(&format!("SELECT COUNT(*) FROM \"{}\".\"j\"", dst.schema), params![])
        .await
        .unwrap();
    assert_eq!(n, 0, "destination rolled back");
    eprintln!("MariaDB JSON→PostgreSQL jsonb caveat confirmed (safe failure): {:?}", result.err());

    src.cleanup().await;
    dst.cleanup().await;
}

#[tokio::test]
async fn copy_mysql_to_sqlite() {
    if mysql_base_url().is_none() {
        eprintln!("KUBUNO_MYSQL_TEST_URL non défini — copy_mysql_to_sqlite ignoré");
        return;
    }
    let src = open_mysql().await;
    let dir = TempDir::new();
    let dst = open_sqlite(dir.str(), "myq").await;
    create_rich(&src.pool, &src.schema, true).await;
    create_rich(&dst.pool, &dst.schema, true).await;
    run_copy(&src, &dst, true, true).await;
    src.cleanup().await;
    dst.cleanup().await;
}

#[tokio::test]
async fn copy_sqlite_to_mysql_documents_the_caveat() {
    if mysql_base_url().is_none() {
        eprintln!("KUBUNO_MYSQL_TEST_URL non défini — copy_sqlite_to_mysql ignoré");
        return;
    }
    let dir = TempDir::new();
    let src = open_sqlite(dir.str(), "sqm").await;
    let dst = open_mysql().await;
    create_rich(&src.pool, &src.schema, true).await;
    create_rich(&dst.pool, &dst.schema, true).await;
    seed(&src.pool, &src.schema, true).await;

    // Same caveat as SQLite→PostgreSQL: SQLite's storage classes cannot be
    // re-derived into MySQL's strict `datetime(6)`/`json` columns (the timestamp
    // and json were stored as TEXT in SQLite), so the copy fails rather than
    // mis-store. Asserted so the boundary is pinned.
    let result = copy_schema(&src.pool, &src.schema, &dst.pool, &dst.schema, &mut |_, _| {}).await;
    assert!(
        result.is_err(),
        "SQLite→MySQL of text-stored datetime/json must fail rather than mis-store; got {result:?}"
    );
    assert_eq!(count(&dst.pool, &dst.schema, "people").await, 0, "destination rolled back");
    assert_eq!(count(&src.pool, &src.schema, "people").await, 2, "source intact after failure");
    eprintln!("SQLite→MySQL caveat confirmed (safe failure): {:?}", result.err());

    src.cleanup().await;
    dst.cleanup().await;
}

// ─────────────────────────────────────────────────────────────────────────────
// #2 — prefix matrix
// ─────────────────────────────────────────────────────────────────────────────

/// The Kubuno schemas of the miniature instance: core, a primary module, its
/// four secondary schemas, and the two newly-added modules.
const KUBUNO_MINI: &[&str] = &[
    "core",
    "office",
    "office_data",
    "office_maths",
    "office_script",
    "office_wb",
    "build",
    "stt",
];
/// A schema that is NOT Kubuno's and must never be touched by a rename.
const FOREIGN: &str = "foreign_thing";

/// Creates `<prefix><schema>` (PostgreSQL schema) with one seeded row.
async fn pg_make_schema(pool: &DbPool, eff: &str) {
    pool.execute(&format!("CREATE SCHEMA \"{eff}\""), params![]).await.expect("create schema");
    pool.execute(&format!("CREATE TABLE \"{eff}\".\"t\" (id int PRIMARY KEY, label text)"), params![])
        .await
        .expect("create t");
    pool.execute(&format!("INSERT INTO \"{eff}\".\"t\" (id, label) VALUES ($1,$2)"), params![1_i32, eff])
        .await
        .expect("seed t");
}

async fn pg_schema_exists(pool: &DbPool, eff: &str) -> bool {
    pool.fetch_scalar::<i64>(
        "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = $1",
        params![eff],
    )
    .await
    .unwrap()
        > 0
}

/// The `label` stored in `<eff>.t` (proves data survived a rename), or `None`.
async fn pg_label(pool: &DbPool, eff: &str) -> Option<String> {
    pool.fetch_optional_scalar::<String>(
        &format!("SELECT label FROM \"{eff}\".\"t\" WHERE id = $1"),
        params![1_i32],
    )
    .await
    .ok()
    .flatten()
}

#[tokio::test]
async fn pg_prefix_matrix_full_chain() {
    if pg_base_url().is_none() {
        eprintln!("KUBUNO_PG_TEST_URL non défini — pg_prefix_matrix ignoré");
        return;
    }
    // A throwaway database makes the bare ('') prefix safe: only our schemas and
    // `public`/`foreign_thing` live here.
    let scope = open_pg().await;
    let pool = &scope.pool;

    // Build the miniature instance at the bare prefix, plus a foreign schema.
    for s in KUBUNO_MINI {
        pg_make_schema(pool, s).await;
    }
    pg_make_schema(pool, FOREIGN).await;

    // discover under '' lists every Kubuno schema (primary AND secondary), never
    // `public` or the foreign schema.
    let mut found = discover_prefixed_schemas(pool, "").await.expect("discover ''");
    found.sort();
    let mut want: Vec<String> = KUBUNO_MINI.iter().map(|s| s.to_string()).collect();
    want.sort();
    assert_eq!(found, want, "bare discovery must list primary + secondary Kubuno schemas only");
    assert!(!found.contains(&FOREIGN.to_string()), "foreign schema not discovered");
    assert!(!found.iter().any(|n| n == "public"), "public not discovered");

    // Transition chain: '' → 'kub_' → 'kb2_' → ''.
    let chain = [("", "kub_"), ("kub_", "kb2_"), ("kb2_", "")];
    for (old, new) in chain {
        let outcome = rename_schema_prefix(pool, old, new).await.expect("rename");
        assert!(!outcome.noop, "PostgreSQL rename is not a no-op");
        let mut renamed = outcome.renamed.clone();
        renamed.sort();
        assert_eq!(renamed, want, "every Kubuno schema (primary + secondary) renamed {old:?}→{new:?}");

        // Old effective names gone, new ones present with data intact.
        for bare in KUBUNO_MINI {
            let eff_old = format!("{old}{bare}");
            let eff_new = format!("{new}{bare}");
            if eff_old != eff_new {
                assert!(!pg_schema_exists(pool, &eff_old).await, "{eff_old} must be gone");
            }
            assert!(pg_schema_exists(pool, &eff_new).await, "{eff_new} must exist");
            assert_eq!(pg_label(pool, &eff_new).await.as_deref(), Some(*bare), "data survived in {eff_new}");
        }
        // The foreign schema is never renamed and keeps its data.
        assert!(pg_schema_exists(pool, FOREIGN).await, "foreign schema untouched");
        assert_eq!(pg_label(pool, FOREIGN).await.as_deref(), Some(FOREIGN), "foreign data intact");
        assert!(pg_schema_exists(pool, "public").await, "public untouched");

        // Directly probe discovery under the NEW prefix: it lists the prefixed
        // Kubuno schemas and nothing foreign.
        let mut disc = discover_prefixed_schemas(pool, new).await.expect("discover new");
        disc.sort();
        let mut want_eff: Vec<String> = KUBUNO_MINI.iter().map(|b| format!("{new}{b}")).collect();
        want_eff.sort();
        assert_eq!(disc, want_eff, "discovery under {new:?} lists prefixed Kubuno schemas");
        assert!(!disc.iter().any(|n| n.contains("foreign")), "no foreign schema under {new:?}");
    }

    scope.cleanup().await;
}

#[tokio::test]
async fn sqlite_prefix_rename_is_a_noop() {
    let dir = TempDir::new();
    let scope = open_sqlite(dir.str(), "core").await;
    let outcome = rename_schema_prefix(&scope.pool, "", "kub_").await.expect("rename");
    assert!(outcome.noop, "SQLite has no server namespace to rename");
    assert!(outcome.renamed.is_empty());
    // Discovery is always empty on SQLite (each schema is a file, not a server
    // namespace).
    assert!(discover_prefixed_schemas(&scope.pool, "kub_").await.expect("discover").is_empty());
    scope.cleanup().await;
}

// ── MySQL prefix chain ────────────────────────────────────────────────────────
// A MySQL database *is* a schema server-wide, and this server already holds real
// bare-named Kubuno databases, so the chain uses only unique, non-colliding
// prefixes (never the bare ''), which still exercises the fixed discovery path
// on primary AND secondary schemas without risking a real database.

/// Creates the MySQL database `<eff>` with one seeded row.
async fn mysql_make_db(pool: &DbPool, eff: &str) {
    pool.execute(&format!("CREATE DATABASE \"{eff}\""), params![]).await.expect("create db");
    pool.execute(&format!("CREATE TABLE \"{eff}\".\"t\" (id int PRIMARY KEY, label text)"), params![])
        .await
        .expect("create t");
    pool.execute(&format!("INSERT INTO \"{eff}\".\"t\" (id, label) VALUES ($1,$2)"), params![1_i32, eff])
        .await
        .expect("seed t");
}

async fn mysql_db_exists(pool: &DbPool, eff: &str) -> bool {
    pool.fetch_scalar::<i64>(
        "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = $1",
        params![eff],
    )
    .await
    .unwrap()
        > 0
}

async fn mysql_label(pool: &DbPool, eff: &str) -> Option<String> {
    pool.fetch_optional_scalar::<String>(
        &format!("SELECT label FROM \"{eff}\".\"t\" WHERE id = $1"),
        params![1_i32],
    )
    .await
    .ok()
    .flatten()
}

#[tokio::test]
async fn mysql_prefix_matrix_covers_secondary_schemas() {
    if mysql_base_url().is_none() {
        eprintln!("KUBUNO_MYSQL_TEST_URL non défini — mysql_prefix_matrix ignoré");
        return;
    }
    let base = mysql_base_url().unwrap();
    let admin = connect(&settings("mysql", serde_json::json!({ "url": base })), "mysql")
        .await
        .expect("mysql admin connect");

    // Unique test prefixes that collide with no real database on the server.
    let p1 = format!("kbsw{}_", tag());
    let p2 = format!("kbsw{}_", tag());
    let p3 = format!("kbsw{}_", tag());
    // A foreign database under p1 whose bare name is not a Kubuno schema.
    let foreign_eff = format!("{p1}{FOREIGN}");

    // Clean any stragglers from a previous aborted run, then build under p1.
    let all_effs = |p: &str| -> Vec<String> {
        KUBUNO_MINI.iter().map(|b| format!("{p}{b}")).collect()
    };
    for p in [&p1, &p2, &p3] {
        for eff in all_effs(p) {
            let _ = admin.execute(&format!("DROP DATABASE IF EXISTS \"{eff}\""), params![]).await;
        }
    }
    let _ = admin.execute(&format!("DROP DATABASE IF EXISTS \"{foreign_eff}\""), params![]).await;

    for eff in all_effs(&p1) {
        mysql_make_db(&admin, &eff).await;
    }
    mysql_make_db(&admin, &foreign_eff).await;

    let mut want: Vec<String> = KUBUNO_MINI.iter().map(|s| s.to_string()).collect();
    want.sort();

    // discover under p1 lists the prefixed primary + secondary schemas, not the
    // foreign one.
    let mut found = discover_prefixed_schemas(&admin, &p1).await.expect("discover p1");
    found.sort();
    let mut want_eff_p1 = all_effs(&p1);
    want_eff_p1.sort();
    assert_eq!(found, want_eff_p1, "discovery under p1 lists prefixed Kubuno schemas");
    assert!(!found.contains(&foreign_eff), "foreign db not discovered");

    // Chain: p1 → p2 → p3 → p1 (never bare).
    let chain = [(&p1, &p2), (&p2, &p3), (&p3, &p1)];
    for (old, new) in chain {
        let outcome = rename_schema_prefix(&admin, old, new).await.expect("mysql rename");
        assert!(!outcome.noop, "MySQL rename is not a no-op");
        let mut renamed = outcome.renamed.clone();
        renamed.sort();
        assert_eq!(renamed, want, "every Kubuno db (primary + secondary) moved {old}→{new}");

        for bare in KUBUNO_MINI {
            let eff_old = format!("{old}{bare}");
            let eff_new = format!("{new}{bare}");
            // The row's `label` was seeded at creation time (under p1) and is
            // never rewritten by a rename, so it still reads the original name —
            // that is the proof the *data* travelled with the renamed database.
            let original = format!("{p1}{bare}");
            assert!(!mysql_db_exists(&admin, &eff_old).await, "{eff_old} must be gone");
            assert!(mysql_db_exists(&admin, &eff_new).await, "{eff_new} must exist");
            assert_eq!(mysql_label(&admin, &eff_new).await.as_deref(), Some(original.as_str()), "data survived");
        }
        // Foreign db (still under p1) is only present while old==p1's family; it
        // is never renamed, so it always keeps its original name and data.
        assert!(mysql_db_exists(&admin, &foreign_eff).await, "foreign db untouched");
        assert_eq!(mysql_label(&admin, &foreign_eff).await.as_deref(), Some(foreign_eff.as_str()));
    }

    // Cleanup: after the p3→p1 step, the family is back under p1; drop it and the
    // foreign db.
    for eff in all_effs(&p1) {
        let _ = admin.execute(&format!("DROP DATABASE IF EXISTS \"{eff}\""), params![]).await;
    }
    let _ = admin.execute(&format!("DROP DATABASE IF EXISTS \"{foreign_eff}\""), params![]).await;
}
