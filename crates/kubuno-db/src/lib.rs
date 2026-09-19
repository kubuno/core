//! Kubuno's database foundation.
//!
//! One Kubuno binary talks to **one** engine, chosen when it is compiled:
//! PostgreSQL (the default), MySQL/MariaDB, or SQLite. This crate is what makes
//! the rest of the code independent of that choice:
//!
//! * [`Db`], [`DbPool`] and friends — the type aliases that replace `Postgres`
//!   and `PgPool` in signatures;
//! * [`query`], [`query_as`], [`query_scalar`] — drop-in replacements for the
//!   sqlx functions that additionally translate `$1` into `?` where needed;
//! * [`dialect`] — the fragments the three engines spell differently;
//! * [`returning`] — how to get a row back on MySQL, which has no `RETURNING`;
//! * [`pool`] — connecting, the SQLite schema layout, migrations;
//! * [`events`] — `pg_notify` and its outbox fallback.
//!
//! # Why a compile-time backend rather than a generic one
//!
//! Writing `async fn f<DB: Database>(pool: &Pool<DB>)` looks tidier, but every
//! caller then has to carry the bounds that let a `Uuid`, a `DateTime<Utc>` or
//! a `serde_json::Value` be bound and decoded — `for<'a> Uuid: Encode<'a, DB>`,
//! `Uuid: Type<DB>`, and one more pair per type per function. Those bounds are
//! viral: they climb from the query up through the service, the handler and the
//! `AppState`. Kubuno binds a `Uuid` in 5178 places.
//!
//! With a type alias, `sqlx::query(...).bind(id).fetch_one(&state.db)` keeps
//! working unchanged, because sqlx infers the database from the executor. The
//! diff in a module is then limited to the SQL text and to `PgPool` →
//! [`DbPool`], and nothing becomes generic.
//!
//! `sqlx::Any` was the third option and it is not usable: it carries only
//! Null/Bool/SmallInt/Integer/BigInt/Real/Double/Text/Blob, so the three types
//! Kubuno uses most — `Uuid`, `Json`, `DateTime<Utc>` — cannot cross it.
//!
//! **The price** is that the engine is baked into the artefact: a module ships
//! one `.kbpkg` per engine, and an instance cannot switch engine without
//! reinstalling. That is the trade this crate takes.

// Exactly one backend. Cargo features are additive, so this is checked rather
// than assumed: a consumer that forgets `default-features = false` while asking
// for MySQL would otherwise silently get two drivers and an arbitrary winner.
#[cfg(all(feature = "backend-postgres", feature = "backend-mysql"))]
compile_error!("kubuno-db: enable exactly one backend — `backend-postgres` and `backend-mysql` are both on (did you forget `default-features = false`?)");
#[cfg(all(feature = "backend-postgres", feature = "backend-sqlite"))]
compile_error!("kubuno-db: enable exactly one backend — `backend-postgres` and `backend-sqlite` are both on (did you forget `default-features = false`?)");
#[cfg(all(feature = "backend-mysql", feature = "backend-sqlite"))]
compile_error!("kubuno-db: enable exactly one backend — `backend-mysql` and `backend-sqlite` are both on");
#[cfg(not(any(
    feature = "backend-postgres",
    feature = "backend-mysql",
    feature = "backend-sqlite"
)))]
compile_error!("kubuno-db: enable exactly one backend — `backend-postgres`, `backend-mysql` or `backend-sqlite`");

pub mod dialect;
pub mod events;
pub mod pool;
pub mod returning;
pub mod sql;

pub use dialect::{Backend, BACKEND};
pub use pool::{connect, DbSettings, SetupError};
pub use sql::{lint, Lint, SqlError};

/// Re-exported so a module can reach sqlx (and `sqlx::migrate!`) through this
/// crate, with the feature set already agreed on.
pub use sqlx;

// ── the one type that changes with the backend ──────────────────────────────

#[cfg(feature = "backend-postgres")]
pub type Db = sqlx::Postgres;
#[cfg(feature = "backend-mysql")]
pub type Db = sqlx::MySql;
#[cfg(feature = "backend-sqlite")]
pub type Db = sqlx::Sqlite;

/// Replaces `sqlx::PgPool` in every signature.
pub type DbPool = sqlx::Pool<Db>;
/// A single connection — what [`returning`] needs, since MySQL has to run two
/// statements and they must land on the same session.
pub type DbConnection = <Db as sqlx::Database>::Connection;
pub type DbRow = <Db as sqlx::Database>::Row;
pub type DbArguments = <Db as sqlx::Database>::Arguments;
pub type DbQueryResult = <Db as sqlx::Database>::QueryResult;
pub type DbTransaction<'c> = sqlx::Transaction<'c, Db>;
pub type DbPoolConnection = sqlx::pool::PoolConnection<Db>;

pub type DbQuery<'q> = sqlx::query::Query<'q, Db, DbArguments>;
pub type DbQueryAs<'q, O> = sqlx::query::QueryAs<'q, Db, O, DbArguments>;
pub type DbQueryScalar<'q, O> = sqlx::query::QueryScalar<'q, Db, O, DbArguments>;

// ── the entry points ────────────────────────────────────────────────────────

/// Like [`sqlx::query`], but accepts PostgreSQL-flavoured text on any engine.
///
/// The text is translated by [`sql::prepare`], which turns `$1` into `?` where
/// the engine wants it and rejects SQL that cannot be translated faithfully.
/// The error is a [`sqlx::Error`], so a module whose error enum already has
/// `#[from] sqlx::Error` needs no new variant:
///
/// ```ignore
/// let row = db::query("SELECT * FROM keestore.vaults WHERE owner_id = $1")?
///     .bind(user_id)
///     .fetch_one(&state.db)
///     .await?;
/// ```
pub fn query<'q>(sql: &str) -> Result<DbQuery<'q>, sqlx::Error> {
    let prepared = sql::prepare(sql).map_err(sql::into_sqlx_error)?;
    Ok(sqlx::query(sql::assert_safe(prepared)))
}

/// Like [`sqlx::query_as`], with the same translation as [`query`].
pub fn query_as<'q, O>(sql: &str) -> Result<DbQueryAs<'q, O>, sqlx::Error>
where
    O: for<'r> sqlx::FromRow<'r, DbRow>,
{
    let prepared = sql::prepare(sql).map_err(sql::into_sqlx_error)?;
    Ok(sqlx::query_as(sql::assert_safe(prepared)))
}

/// Like [`sqlx::query_scalar`], with the same translation as [`query`].
pub fn query_scalar<'q, O>(sql: &str) -> Result<DbQueryScalar<'q, O>, sqlx::Error>
where
    (O,): for<'r> sqlx::FromRow<'r, DbRow>,
{
    let prepared = sql::prepare(sql).map_err(sql::into_sqlx_error)?;
    Ok(sqlx::query_scalar(sql::assert_safe(prepared)))
}

/// A fresh primary key, generated by the process rather than by the database.
///
/// Kubuno's 295 tables declare `DEFAULT gen_random_uuid()`, which no other
/// engine has and which — more importantly — makes the new key unknowable
/// without `RETURNING`. Since MySQL has no `RETURNING`, **every insert that
/// needs its key back must generate it here and bind it explicitly.**
///
/// The PostgreSQL `DEFAULT` can stay in place: a migration that has been
/// applied is frozen, and an explicitly bound value overrides the default
/// anyway. The MySQL and SQLite migrations simply declare the column without
/// one.
#[inline]
pub fn new_id() -> uuid::Uuid {
    uuid::Uuid::new_v4()
}
