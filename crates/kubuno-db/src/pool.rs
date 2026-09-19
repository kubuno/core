//! Connecting, and what "a schema" means on each engine.
//!
//! Kubuno writes `keestore.vaults` — a schema-qualified name — and that works
//! on all three engines, but for three different reasons:
//!
//! * **PostgreSQL**: a real schema inside the database.
//! * **MySQL/MariaDB**: there are no schemas; a database *is* the namespace, so
//!   `keestore.vaults` is a table in the `keestore` database. The connection's
//!   default database is irrelevant as long as the user can reach `keestore`.
//! * **SQLite**: `ATTACH DATABASE '…/keestore.sqlite' AS keestore`, which has
//!   to be re-issued on **every** connection of the pool — hence the
//!   `after_connect` hook below.
//!
//! The SQLite layout deserves a word. The attached file holds the module's
//! tables *and* its `_sqlx_migrations`, thanks to
//! [`sqlx::migrate::Migrator::dangerous_set_table_name`] accepting a qualified
//! name. The connection's own `main` database is `:memory:` and stays empty, so
//! there is exactly one file per module and nothing shared between modules.

#[cfg(any(feature = "backend-postgres", feature = "backend-mysql"))]
use std::str::FromStr;
use std::time::Duration;

use serde::Deserialize;

use crate::{dialect::Backend, DbPool, BACKEND};

/// Anything that went wrong before the first query.
#[derive(Debug, thiserror::Error)]
pub enum SetupError {
    #[error("database settings: {0}")]
    Settings(String),
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),
}

/// The `[database]` section of a module's configuration.
///
/// Field for field what the modules already deserialise, plus `path` for
/// SQLite. Which fields matter depends on the engine the binary was built for,
/// so a single `config.toml` can describe all three.
#[derive(Debug, Clone, Deserialize)]
pub struct DbSettings {
    /// A full connection URL. Takes priority over the discrete fields when the
    /// latter are absent.
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub host: Option<String>,
    #[serde(default)]
    pub port: Option<u16>,
    #[serde(default)]
    pub user: Option<String>,
    #[serde(default)]
    pub password: Option<String>,
    /// PostgreSQL/MySQL: the database to connect to. Ignored by SQLite.
    #[serde(default)]
    pub database: Option<String>,
    /// SQLite only: the directory holding `<schema>.sqlite`. Defaults to
    /// `./data`.
    #[serde(default)]
    pub path: Option<String>,

    #[serde(default = "default_max_connections")]
    pub max_connections: u32,
    #[serde(default)]
    pub min_connections: u32,
    #[serde(default = "default_connect_timeout", with = "duration_secs")]
    pub connect_timeout: Duration,
    #[serde(default = "default_true")]
    pub run_migrations: bool,
}

fn default_max_connections() -> u32 {
    10
}
fn default_connect_timeout() -> Duration {
    Duration::from_secs(10)
}
fn default_true() -> bool {
    true
}

/// `connect_timeout = 10` in TOML, a `Duration` in Rust. Same encoding the
/// modules already use, so no configuration file has to change.
pub mod duration_secs {
    use std::time::Duration;

    use serde::{Deserialize, Deserializer};

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Duration, D::Error> {
        Ok(Duration::from_secs(u64::deserialize(d)?))
    }
}

#[cfg(feature = "backend-sqlite")]
impl DbSettings {
    /// Where SQLite keeps this module's file.
    fn sqlite_file(&self, schema: &str) -> String {
        if let Some(url) = &self.url {
            if let Some(rest) = url.strip_prefix("sqlite://") {
                return rest.to_string();
            }
        }
        let dir = self.path.as_deref().unwrap_or("./data");
        format!("{}/{schema}.sqlite", dir.trim_end_matches('/'))
    }
}

/// Opens the pool for the compiled-in engine and makes `schema` usable.
///
/// `schema` is the module's namespace — `"keestore"`, `"drive"`… It is
/// `&'static str` because it ends up in SQL text.
///
/// The schema is created if missing (PostgreSQL `CREATE SCHEMA`, MySQL
/// `CREATE DATABASE`; SQLite's `ATTACH` creates the file on its own).
pub async fn connect(settings: &DbSettings, schema: &'static str) -> Result<DbPool, SetupError> {
    let pool = open(settings, schema).await?;
    ensure_schema(&pool, schema).await?;
    Ok(pool)
}

#[cfg(feature = "backend-postgres")]
async fn open(s: &DbSettings, _schema: &'static str) -> Result<DbPool, SetupError> {
    use sqlx::postgres::{PgConnectOptions, PgPoolOptions};

    let opts = if s.host.is_some() || s.user.is_some() {
        let user = s.user.as_deref().ok_or_else(|| missing("user"))?;
        let password = s.password.as_deref().ok_or_else(|| missing("password"))?;
        let database = s.database.as_deref().ok_or_else(|| missing("database"))?;
        PgConnectOptions::new()
            .host(s.host.as_deref().unwrap_or("localhost"))
            .port(s.port.unwrap_or(5432))
            .username(user)
            .password(password)
            .database(database)
    } else {
        let url = s.url.as_deref().ok_or_else(|| missing("url"))?;
        PgConnectOptions::from_str(url).map_err(|e| SetupError::Settings(e.to_string()))?
    };

    Ok(PgPoolOptions::new()
        .max_connections(s.max_connections)
        .min_connections(s.min_connections)
        .acquire_timeout(s.connect_timeout)
        .connect_with(opts)
        .await?)
}

#[cfg(feature = "backend-mysql")]
async fn open(s: &DbSettings, schema: &'static str) -> Result<DbPool, SetupError> {
    use sqlx::mysql::{MySqlConnectOptions, MySqlPoolOptions};

    let opts = if s.host.is_some() || s.user.is_some() {
        let user = s.user.as_deref().ok_or_else(|| missing("user"))?;
        let password = s.password.as_deref().ok_or_else(|| missing("password"))?;
        MySqlConnectOptions::new()
            .host(s.host.as_deref().unwrap_or("localhost"))
            .port(s.port.unwrap_or(3306))
            .username(user)
            .password(password)
            // The module's tables live in the `<schema>` database; connecting
            // straight to it keeps unqualified names working too. It may not
            // exist yet on a first run, so fall back to the configured one.
            .database(s.database.as_deref().unwrap_or(schema))
    } else {
        let url = s.url.as_deref().ok_or_else(|| missing("url"))?;
        MySqlConnectOptions::from_str(url).map_err(|e| SetupError::Settings(e.to_string()))?
    };

    Ok(MySqlPoolOptions::new()
        .max_connections(s.max_connections)
        .min_connections(s.min_connections)
        .acquire_timeout(s.connect_timeout)
        .connect_with(opts)
        .await?)
}

#[cfg(feature = "backend-sqlite")]
async fn open(s: &DbSettings, schema: &'static str) -> Result<DbPool, SetupError> {
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};

    let file = s.sqlite_file(schema);
    if let Some(dir) = std::path::Path::new(&file).parent() {
        if !dir.as_os_str().is_empty() {
            std::fs::create_dir_all(dir)
                .map_err(|e| SetupError::Settings(format!("{}: {e}", dir.display())))?;
        }
    }
    // A path is not a SQL literal: a single quote in it would close the string
    // that ATTACH takes. Doubling it is SQLite's own escape.
    let attach = format!(
        "ATTACH DATABASE '{}' AS {schema}",
        file.replace('\'', "''")
    );

    // `main` is a private temporary database that SQLite creates and deletes on
    // its own (an empty filename), so everything — migration bookkeeping
    // included — lives in the attached file.
    //
    // It must NOT be `:memory:`: SQLite propagates `SQLITE_OPEN_MEMORY` to
    // every database ATTACHed afterwards, which would silently turn the
    // module's data file into a per-connection in-memory database. That failure
    // is invisible — the ATTACH succeeds, writes succeed, and the next
    // connection of the pool sees an empty schema.
    let opts = SqliteConnectOptions::new()
        .filename("")
        // Needed both for `main` and for the ATTACHed file: SQLite opens an
        // attached database with the same flags as the connection, so without
        // SQLITE_OPEN_CREATE the module's own file could never be created.
        .create_if_missing(true)
        .foreign_keys(true)
        .busy_timeout(s.connect_timeout);

    let wal = format!("PRAGMA {schema}.journal_mode = WAL");

    Ok(SqlitePoolOptions::new()
        .max_connections(s.max_connections)
        .min_connections(s.min_connections)
        .acquire_timeout(s.connect_timeout)
        .after_connect(move |conn, _meta| {
            let attach = attach.clone();
            let wal = wal.clone();
            Box::pin(async move {
                use sqlx::Executor as _;
                // Every connection of the pool needs its own ATTACH.
                conn.execute(sqlx::AssertSqlSafe(attach)).await?;
                // Qualified: the pragmas must reach the module's file, not the
                // throwaway `main`.
                conn.execute(sqlx::AssertSqlSafe(wal)).await?;
                conn.execute("PRAGMA synchronous = NORMAL").await?;
                Ok(())
            })
        })
        .connect_with(opts)
        .await?)
}

#[cfg(any(feature = "backend-postgres", feature = "backend-mysql"))]
fn missing(field: &str) -> SetupError {
    SetupError::Settings(format!(
        "`database.{field}` is required (or give `database.url`)"
    ))
}

/// `CREATE SCHEMA IF NOT EXISTS`, in the local sense of "schema".
pub async fn ensure_schema(pool: &DbPool, schema: &'static str) -> Result<(), sqlx::Error> {
    match BACKEND {
        Backend::Postgres => {
            crate::query(&format!("CREATE SCHEMA IF NOT EXISTS {schema}"))?
                .execute(pool)
                .await?;
        }
        Backend::MySql => {
            crate::query(&format!("CREATE DATABASE IF NOT EXISTS `{schema}`"))?
                .execute(pool)
                .await?;
        }
        // The ATTACH in `after_connect` already created the file.
        Backend::Sqlite => {}
    }
    Ok(())
}

/// Points a migrator at the module's own namespace.
///
/// Without this, `_sqlx_migrations` lands wherever the connection's default
/// namespace happens to be — `public` on PostgreSQL, the connection database on
/// MySQL, and the throwaway in-memory `main` on SQLite, which would re-run
/// every migration at each start.
///
/// On PostgreSQL this is *not* a move: modules already run their migrations
/// with `search_path = <schema>`, so the table is already
/// `<schema>._sqlx_migrations`. Naming it explicitly removes the need for the
/// second, search-path-carrying pool the modules open today.
pub fn scope_migrator(
    mut migrator: sqlx::migrate::Migrator,
    schema: &'static str,
) -> sqlx::migrate::Migrator {
    migrator.dangerous_set_table_name(format!("{schema}._sqlx_migrations"));
    migrator
}

/// Picks the migration directory matching the compiled-in engine.
///
/// `sqlx::migrate!` needs a string *literal*, so the three paths are spelled
/// out rather than composed:
///
/// ```ignore
/// let m = kubuno_db::migrations!(
///     "./migrations/postgres",
///     "./migrations/mysql",
///     "./migrations/sqlite",
/// );
/// kubuno_db::pool::scope_migrator(m, "keestore").run(&pool).await?;
/// ```
///
/// The paths are resolved against the *calling* crate's manifest directory, as
/// `sqlx::migrate!` always does.
///
/// The three definitions below are gated on **this** crate's features, not the
/// caller's: the selection has to follow the backend kubuno-db was built with,
/// and a `#[cfg]` written inside the macro body would be evaluated against the
/// calling crate instead.
#[cfg(feature = "backend-postgres")]
#[macro_export]
macro_rules! migrations {
    ($postgres:literal, $mysql:literal, $sqlite:literal $(,)?) => {
        $crate::sqlx::migrate!($postgres)
    };
}

#[cfg(feature = "backend-mysql")]
#[macro_export]
macro_rules! migrations {
    ($postgres:literal, $mysql:literal, $sqlite:literal $(,)?) => {
        $crate::sqlx::migrate!($mysql)
    };
}

#[cfg(feature = "backend-sqlite")]
#[macro_export]
macro_rules! migrations {
    ($postgres:literal, $mysql:literal, $sqlite:literal $(,)?) => {
        $crate::sqlx::migrate!($sqlite)
    };
}
