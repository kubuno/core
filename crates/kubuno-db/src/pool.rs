//! Connecting, the per-engine session policy, and what "a schema" means.
//!
//! The engine is chosen at run time from [`DbSettings::engine`], so [`connect`]
//! opens one of three concrete pools and hands back a [`DbPool`] enum. All
//! three drivers are compiled into the binary.
//!
//! `keestore.vaults` — a schema-qualified name — works on all three engines:
//!
//! * **PostgreSQL**: a real schema inside the database.
//! * **MySQL/MariaDB**: no schemas; a database *is* the namespace, so
//!   `keestore.vaults` is a table in the `keestore` database.
//! * **SQLite**: `ATTACH DATABASE '…/keestore.sqlite' AS keestore`, re-issued on
//!   every pooled connection.
//!
//! Per-engine session policy also lives here (see `after_connect`): SQLite gets
//! `WAL` + a generous `busy_timeout` + foreign keys; MySQL gets
//! `time_zone = '+00:00'` and a case-sensitive `utf8mb4` collation, so a UTC
//! timestamp round-trips and a `UNIQUE` key does not fold case.

use std::str::FromStr;
use std::time::Duration;

use serde::Deserialize;
use sqlx::Executor as _;

use crate::dialect::Backend;
use crate::exec::{DbPool, SqliteHandle};
use crate::schema::SchemaPrefix;

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
/// A single `config.toml` can describe all three engines; `engine` selects
/// which fields matter.
#[derive(Debug, Clone, Deserialize)]
pub struct DbSettings {
    /// `"postgres"` (default), `"mysql"`/`"mariadb"`, or `"sqlite"`. This is the
    /// administrator's choice of engine.
    #[serde(default = "default_engine")]
    pub engine: String,

    /// A full connection URL. Takes priority over the discrete fields.
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
    /// SQLite only: the directory holding `<schema>.sqlite`. Defaults to `./data`.
    #[serde(default)]
    pub path: Option<String>,

    /// Optional schema-name prefix (WordPress-style), so several Kubuno instances
    /// can share one database server. Empty/absent means no prefix, and the
    /// behaviour is then byte-for-byte identical to before this existed. A
    /// non-empty value must match `^[a-z0-9_]{1,32}$`; it is validated when the
    /// pool is opened. See [`crate::schema::SchemaPrefix`].
    #[serde(default)]
    pub schema_prefix: Option<String>,

    #[serde(default = "default_max_connections")]
    pub max_connections: u32,
    #[serde(default)]
    pub min_connections: u32,
    #[serde(default = "default_connect_timeout", with = "duration_secs")]
    pub connect_timeout: Duration,
    #[serde(default = "default_true")]
    pub run_migrations: bool,
}

fn default_engine() -> String {
    "postgres".to_string()
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

impl DbSettings {
    /// The engine, parsed. Errors rather than defaulting silently on a typo.
    pub fn backend(&self) -> Result<Backend, SetupError> {
        Backend::parse(&self.engine)
            .ok_or_else(|| SetupError::Settings(format!("unknown database engine `{}`", self.engine)))
    }

    /// Where SQLite keeps this module's file. `eff_schema` is the effective
    /// (possibly prefixed) schema name, so several prefixed instances get
    /// distinct files (`kub_notes.sqlite` next to `notes.sqlite`).
    fn sqlite_file(&self, eff_schema: &str) -> String {
        if let Some(url) = &self.url {
            if let Some(rest) = url.strip_prefix("sqlite://") {
                return rest.to_string();
            }
        }
        let dir = self.path.as_deref().unwrap_or("./data");
        format!("{}/{eff_schema}.sqlite", dir.trim_end_matches('/'))
    }
}

/// `connect_timeout = 10` in TOML, a `Duration` in Rust.
pub mod duration_secs {
    use std::time::Duration;

    use serde::{Deserialize, Deserializer};

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Duration, D::Error> {
        Ok(Duration::from_secs(u64::deserialize(d)?))
    }
}

/// Opens the pool for the configured engine and makes `schema` usable.
///
/// When `settings.schema_prefix` is set the effective schema is
/// `<prefix><schema>` everywhere: the PostgreSQL `search_path`, the MySQL
/// connection database, the SQLite file and its `ATTACH` alias, the
/// `CREATE SCHEMA`/`CREATE DATABASE`, and — through the pool's [`SchemaPrefix`] —
/// every statement and migration. With no prefix (the default) the effective
/// schema is just `schema` and nothing changes.
pub async fn connect(settings: &DbSettings, schema: &'static str) -> Result<DbPool, SetupError> {
    let prefix = SchemaPrefix::new(settings.schema_prefix.as_deref()).map_err(SetupError::Settings)?;
    let eff = prefix.schema(schema);
    let pool = match settings.backend()? {
        Backend::Postgres => open_pg(settings, &eff, prefix.clone()).await?,
        Backend::MySql => open_mysql(settings, &eff, prefix.clone()).await?,
        Backend::Sqlite => open_sqlite(settings, &eff, prefix.clone()).await?,
    };
    ensure_schema(&pool, &eff).await?;
    Ok(pool)
}

async fn open_pg(s: &DbSettings, eff_schema: &str, prefix: SchemaPrefix) -> Result<DbPool, SetupError> {
    use sqlx::postgres::{PgConnectOptions, PgPoolOptions};

    let opts = if s.host.is_some() || s.user.is_some() {
        PgConnectOptions::new()
            .host(s.host.as_deref().unwrap_or("localhost"))
            .port(s.port.unwrap_or(5432))
            .username(s.user.as_deref().ok_or_else(|| missing("user"))?)
            .password(s.password.as_deref().ok_or_else(|| missing("password"))?)
            .database(s.database.as_deref().ok_or_else(|| missing("database"))?)
    } else {
        PgConnectOptions::from_str(s.url.as_deref().ok_or_else(|| missing("url"))?)
            .map_err(|e| SetupError::Settings(e.to_string()))?
    };

    // Put the module's schema on the search path, the way each module's
    // bootstrap used to before the foundation owned it. Two reasons it must
    // live here:
    //   * a migration written before multi-engine support spelled its tables
    //     unqualified (`CREATE TABLE foo`), trusting the search path —
    //     re-qualifying it to `<schema>.foo` would change its bytes and so its
    //     checksum, and an already migrated PostgreSQL instance would refuse to
    //     start. With the path set, those files stay byte-identical.
    //   * `public` stays on the path so an extension the core installs there
    //     (uuid-ossp, pg_trgm) resolves unqualified.
    // `after_connect` wants a `'static` statement (like the MySQL literals
    // below). `eff_schema` is only borrowed, so leak the one formatted string
    // once — a single bounded allocation for the life of the pool. The prefix
    // and schema are both validated bare identifiers, so nothing user-controlled
    // reaches this text.
    let set_path: &'static str =
        Box::leak(format!("SET search_path = {eff_schema}, public").into_boxed_str());
    let pool = PgPoolOptions::new()
        .max_connections(s.max_connections)
        .min_connections(s.min_connections)
        .acquire_timeout(s.connect_timeout)
        .after_connect(move |conn, _meta| {
            Box::pin(async move {
                conn.execute(set_path).await?;
                Ok(())
            })
        })
        .connect_with(opts)
        .await?;
    Ok(DbPool::from_pg(pool, prefix))
}

async fn open_mysql(s: &DbSettings, eff_schema: &str, prefix: SchemaPrefix) -> Result<DbPool, SetupError> {
    use sqlx::mysql::{MySqlConnectOptions, MySqlPoolOptions};

    let opts = if s.host.is_some() || s.user.is_some() {
        MySqlConnectOptions::new()
            .host(s.host.as_deref().unwrap_or("localhost"))
            .port(s.port.unwrap_or(3306))
            .username(s.user.as_deref().ok_or_else(|| missing("user"))?)
            .password(s.password.as_deref().ok_or_else(|| missing("password"))?)
    } else {
        MySqlConnectOptions::from_str(s.url.as_deref().ok_or_else(|| missing("url"))?)
            .map_err(|e| SetupError::Settings(e.to_string()))?
    };
    // On MySQL/MariaDB a database *is* the schema namespace, so the connection's
    // default database must be the effective (possibly prefixed) schema: the
    // unqualified DDL in the migrations lands there, and it is the database the
    // qualified `<schema>.table` names resolve to after prefix rewriting. This
    // overrides any database named in the URL/fields — that name is never the
    // namespace on MySQL. The database must already exist (or the role must hold
    // CREATE, so `ensure_schema` can make it).
    let opts = opts.database(eff_schema);

    let pool = MySqlPoolOptions::new()
        .max_connections(s.max_connections)
        .min_connections(s.min_connections)
        .acquire_timeout(s.connect_timeout)
        .after_connect(|conn, _meta| {
            Box::pin(async move {
                // Every value Kubuno writes is UTC; without this a DATETIME
                // would be read back shifted by the server's local offset.
                conn.execute("SET time_zone = '+00:00'").await?;
                // Case- and accent-sensitive, so a UNIQUE key does not fold two
                // distinct values into one (the default utf8mb4_0900_ai_ci does).
                conn.execute("SET NAMES utf8mb4 COLLATE utf8mb4_bin").await?;
                Ok(())
            })
        })
        .connect_with(opts)
        .await?;
    Ok(DbPool::from_mysql(pool, prefix))
}

async fn open_sqlite(s: &DbSettings, eff_schema: &str, prefix: SchemaPrefix) -> Result<DbPool, SetupError> {
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};

    let file = s.sqlite_file(eff_schema);
    if let Some(dir) = std::path::Path::new(&file).parent() {
        if !dir.as_os_str().is_empty() {
            std::fs::create_dir_all(dir)
                .map_err(|e| SetupError::Settings(format!("{}: {e}", dir.display())))?;
        }
    }
    // A path is not a SQL literal: a single quote in it would close the ATTACH
    // string. Doubling it is SQLite's own escape. The alias is the effective
    // (possibly prefixed) schema, so qualified `<schema>.table` names resolve to
    // it after prefix rewriting; `eff_schema` is a validated bare identifier.
    let attach = format!("ATTACH DATABASE '{}' AS {eff_schema}", file.replace('\'', "''"));
    let wal = format!("PRAGMA {eff_schema}.journal_mode = WAL");

    // `main` is a private temporary database (empty filename), never `:memory:`:
    // SQLite propagates SQLITE_OPEN_MEMORY to every ATTACHed database, which
    // would silently turn the module's file into a per-connection in-memory one.
    let opts = SqliteConnectOptions::new()
        .filename("")
        .create_if_missing(true)
        .foreign_keys(true)
        // Generous: the app-level single-writer gate keeps real contention low,
        // this covers checkpoints and the occasional overlap.
        .busy_timeout(Duration::from_secs(10));

    let pool = SqlitePoolOptions::new()
        .max_connections(s.max_connections)
        .min_connections(s.min_connections)
        .acquire_timeout(s.connect_timeout)
        .after_connect(move |conn, _meta| {
            let attach = attach.clone();
            let wal = wal.clone();
            Box::pin(async move {
                conn.execute(sqlx::AssertSqlSafe(attach)).await?;
                // Qualified: the pragma must reach the module's file, not `main`.
                conn.execute(sqlx::AssertSqlSafe(wal)).await?;
                conn.execute("PRAGMA synchronous = NORMAL").await?;
                Ok(())
            })
        })
        .connect_with(opts)
        .await?;
    Ok(DbPool::from_sqlite(SqliteHandle::new(pool), prefix))
}

fn missing(field: &str) -> SetupError {
    SetupError::Settings(format!("`database.{field}` is required (or give `database.url`)"))
}

/// `CREATE SCHEMA IF NOT EXISTS`, in the local sense of "schema". `eff_schema` is
/// the effective (possibly prefixed) name — the same `<prefix><schema>` the pool
/// was opened against.
pub async fn ensure_schema(pool: &DbPool, eff_schema: &str) -> Result<(), sqlx::Error> {
    use crate::params;
    match pool.backend() {
        Backend::Postgres => {
            pool.execute(&format!("CREATE SCHEMA IF NOT EXISTS {eff_schema}"), params![])
                .await?;
        }
        Backend::MySql => {
            pool.execute(&format!("CREATE DATABASE IF NOT EXISTS `{eff_schema}`"), params![])
                .await?;
        }
        // The ATTACH in `after_connect` already created the file.
        Backend::Sqlite => {}
    }
    Ok(())
}

/// The three migration directories of a module, one per engine, resolved at
/// compile time. Build it with [`crate::migrations!`] and run the one that
/// matches the pool.
pub struct MigratorSet {
    pub postgres: sqlx::migrate::Migrator,
    pub mysql: sqlx::migrate::Migrator,
    pub sqlite: sqlx::migrate::Migrator,
}

impl MigratorSet {
    /// Runs the migrations for the pool's engine, keeping `_sqlx_migrations`
    /// inside the module's own namespace (the same table PostgreSQL already
    /// used through its search_path — so an applied migration is not re-run).
    pub async fn run(
        mut self,
        pool: &DbPool,
        schema: &'static str,
    ) -> Result<(), sqlx::migrate::MigrateError> {
        use crate::exec::PoolKind;
        let prefix = pool.schema_prefix().clone();
        let eff = prefix.schema(schema);
        let table = format!("{eff}._sqlx_migrations");
        match pool.kind() {
            PoolKind::Pg(p) => {
                apply_prefix_to_migrator(&mut self.postgres, &prefix);
                self.postgres.dangerous_set_table_name(table);
                self.postgres.run(p).await
            }
            PoolKind::My(p) => {
                apply_prefix_to_migrator(&mut self.mysql, &prefix);
                self.mysql.dangerous_set_table_name(table);
                self.mysql.run(p).await
            }
            PoolKind::Sq(h) => {
                apply_prefix_to_migrator(&mut self.sqlite, &prefix);
                self.sqlite.dangerous_set_table_name(table);
                self.sqlite.run(&h.pool).await
            }
        }
    }
}

/// Rewrites a migrator's SQL so a prefixed instance's DDL lands in the prefixed
/// schema.
///
/// It only changes anything where a migration spells a schema qualifier: the
/// consolidated SQLite migrations do (`CREATE TABLE notes.foo`,
/// `CREATE INDEX notes.idx ...`), and any PostgreSQL migration that references a
/// sibling schema (`core.users`) does too. Unqualified DDL — the PostgreSQL and
/// MySQL norm, which leans on the search_path / connection database — is left
/// untouched.
///
/// When no prefix is set this returns immediately, leaving the migrator exactly
/// as `sqlx::migrate!` compiled it: byte-identical SQL and therefore unchanged
/// checksums, so an already-migrated instance is never disturbed. A prefixed
/// instance is always a fresh database, so recomputing its checksums from the
/// rewritten text is safe and stable across runs.
fn apply_prefix_to_migrator(m: &mut sqlx::migrate::Migrator, prefix: &SchemaPrefix) {
    use sqlx::migrate::Migration;
    use sqlx::{AssertSqlSafe, SqlSafeStr};
    if prefix.is_empty() {
        return;
    }
    let rewritten: Vec<Migration> = m
        .iter()
        .map(|mig| {
            let sql = prefix.rewrite(mig.sql.as_str()).into_owned();
            Migration::new(
                mig.version,
                mig.description.clone(),
                mig.migration_type,
                AssertSqlSafe(sql).into_sql_str(),
                mig.no_tx,
            )
        })
        .collect();
    m.migrations = std::borrow::Cow::Owned(rewritten);
}

/// Builds a [`MigratorSet`] from the three per-engine migration directories.
///
/// ```ignore
/// kubuno_db::migrations!(
///     "./migrations/postgres",
///     "./migrations/mysql",
///     "./migrations/sqlite",
/// )
/// .run(&pool, "keestore")
/// .await?;
/// ```
#[macro_export]
macro_rules! migrations {
    ($postgres:literal, $mysql:literal, $sqlite:literal $(,)?) => {
        $crate::pool::MigratorSet {
            postgres: $crate::sqlx::migrate!($postgres),
            mysql: $crate::sqlx::migrate!($mysql),
            sqlite: $crate::sqlx::migrate!($sqlite),
        }
    };
}
