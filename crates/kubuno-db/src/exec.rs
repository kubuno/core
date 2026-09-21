//! The runtime executor: one binary, three drivers, the engine chosen at
//! start-up.
//!
//! [`DbPool`] is an enum over the three concrete sqlx pools. Application code
//! never names an engine: it calls `db.fetch_one_as::<T>(sql, params![...])`
//! and this layer picks the driver, rewrites the placeholders through
//! [`crate::sql::prepare`], binds the [`DbValue`]s and decodes the result.
//!
//! sqlx underneath does **no** dialect translation — the SQL text is already
//! correct for the engine (that is the [`crate::dialect`] layer's job); sqlx
//! only carries it and encodes/decodes the parameters.
//!
//! # Where the per-engine concurrency discipline lives
//!
//! It lives here, invisibly to callers:
//!
//! * **SQLite is single-writer.** Every write ([`DbPool::execute`]) and every
//!   write transaction ([`DbPool::begin`]) takes a process-wide permit
//!   ([`SqliteHandle::write`], a `Semaphore` of one), so writers serialise
//!   instead of colliding. Reads do not take it and stay concurrent (WAL).
//! * **`SQLITE_BUSY`/`LOCKED` is retried** with bounded back-off in this layer,
//!   not in the modules.
//! * **`WAL` + a generous `busy_timeout`**, and MySQL's per-session
//!   `time_zone = '+00:00'` and a case-sensitive collation, are set in
//!   `after_connect` (see [`crate::pool`]).

use std::sync::Arc;
use std::time::Duration;

use sqlx::mysql::MySqlRow;
use sqlx::postgres::PgRow;
use sqlx::sqlite::SqliteRow;
use sqlx::{Decode, FromRow, MySql, Postgres, Row, Sqlite, Type};
use tokio::sync::{OwnedSemaphorePermit, Semaphore};

use crate::dialect::Backend;
use crate::sql;
use crate::value::DbValue;

/// A connection pool for whichever engine the process was configured with.
#[derive(Clone)]
pub enum DbPool {
    Pg(sqlx::PgPool),
    My(sqlx::MySqlPool),
    Sq(SqliteHandle),
}

/// SQLite's pool plus the single-writer gate. Cloneable: every clone shares the
/// same `Semaphore`, so the gate is process-wide.
#[derive(Clone)]
pub struct SqliteHandle {
    pub(crate) pool: sqlx::SqlitePool,
    pub(crate) write: Arc<Semaphore>,
}

impl SqliteHandle {
    pub(crate) fn new(pool: sqlx::SqlitePool) -> Self {
        SqliteHandle {
            pool,
            write: Arc::new(Semaphore::new(1)),
        }
    }
}

/// Binds every [`DbValue`] onto a sqlx query, in order. A macro rather than a
/// generic function so it monomorphises at each concrete call site and never
/// forces the viral `Encode<DB>` bounds up into callers.
macro_rules! bind_all {
    ($q:expr, $params:expr) => {{
        let mut q = $q;
        for v in $params {
            q = match v {
                // An untyped NULL. A typed `None` (below) is preferred.
                DbValue::Null => q.bind(None::<i64>),
                DbValue::Bool(o) => q.bind(o),
                DbValue::I16(o) => q.bind(o),
                DbValue::I32(o) => q.bind(o),
                DbValue::I64(o) => q.bind(o),
                DbValue::F32(o) => q.bind(o),
                DbValue::F64(o) => q.bind(o),
                DbValue::Text(o) => q.bind(o),
                DbValue::Blob(o) => q.bind(o),
                DbValue::Uuid(o) => q.bind(o),
                DbValue::Json(o) => q.bind(o),
                DbValue::DateTimeUtc(o) => q.bind(o),
                DbValue::NaiveDate(o) => q.bind(o),
            };
        }
        q
    }};
}

/// A row read back without a target struct — for the [`crate::returning`]
/// helpers and any place that maps columns by hand.
pub enum DbRow {
    Pg(PgRow),
    My(MySqlRow),
    Sq(SqliteRow),
}

impl DbRow {
    /// Decode a column by name. `T` must decode on the three engines; owned
    /// types (`Uuid`, `i64`, `String`, `DateTime<Utc>`, `Option<_>`…) do.
    pub fn try_get<'r, T>(&'r self, col: &str) -> Result<T, sqlx::Error>
    where
        T: Decode<'r, Postgres> + Type<Postgres>,
        T: Decode<'r, MySql> + Type<MySql>,
        T: Decode<'r, Sqlite> + Type<Sqlite>,
    {
        match self {
            DbRow::Pg(r) => r.try_get(col),
            DbRow::My(r) => r.try_get(col),
            DbRow::Sq(r) => r.try_get(col),
        }
    }
}

/// The bound on a struct decodable from any of the three engines' rows. Written
/// once here so a module's struct only needs `#[derive(sqlx::FromRow)]`.
pub trait FromAnyRow:
    Send
    + Unpin
    + for<'r> FromRow<'r, PgRow>
    + for<'r> FromRow<'r, MySqlRow>
    + for<'r> FromRow<'r, SqliteRow>
{
}
impl<T> FromAnyRow for T where
    T: Send
        + Unpin
        + for<'r> FromRow<'r, PgRow>
        + for<'r> FromRow<'r, MySqlRow>
        + for<'r> FromRow<'r, SqliteRow>
{
}

/// The bound on a single-column scalar decodable from any of the three engines.
pub trait ScalarAnyRow:
    Send
    + Unpin
    + for<'r> Decode<'r, Postgres>
    + Type<Postgres>
    + for<'r> Decode<'r, MySql>
    + Type<MySql>
    + for<'r> Decode<'r, Sqlite>
    + Type<Sqlite>
{
}
impl<T> ScalarAnyRow for T where
    T: Send
        + Unpin
        + for<'r> Decode<'r, Postgres>
        + Type<Postgres>
        + for<'r> Decode<'r, MySql>
        + Type<MySql>
        + for<'r> Decode<'r, Sqlite>
        + Type<Sqlite>
{
}

impl DbPool {
    /// Which engine this pool talks to.
    pub fn backend(&self) -> Backend {
        match self {
            DbPool::Pg(_) => Backend::Postgres,
            DbPool::My(_) => Backend::MySql,
            DbPool::Sq(_) => Backend::Sqlite,
        }
    }

    fn prepare(&self, sql: &str) -> Result<String, sqlx::Error> {
        Ok(sql::prepare(sql, self.backend())
            .map_err(sql::into_sqlx_error)?
            .into_owned())
    }

    // ── writes ────────────────────────────────────────────────────────────────

    /// Runs a write and returns the number of rows affected.
    ///
    /// On SQLite this takes the single-writer permit and retries on a transient
    /// `BUSY`/`LOCKED`.
    pub async fn execute(&self, sql: &str, params: Vec<DbValue>) -> Result<u64, sqlx::Error> {
        let prepared = self.prepare(sql)?;
        match self {
            DbPool::Pg(p) => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .execute(p)
                .await?
                .rows_affected()),
            DbPool::My(p) => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .execute(p)
                .await?
                .rows_affected()),
            DbPool::Sq(h) => {
                let _permit = h.write.acquire().await.expect("write semaphore never closes");
                with_sqlite_retry(|| {
                    let sql = prepared.clone();
                    let params = params.clone();
                    let pool = h.pool.clone();
                    async move {
                        Ok(bind_all!(sqlx::query(safe(sql)), params)
                            .execute(&pool)
                            .await?
                            .rows_affected())
                    }
                })
                .await
            }
        }
    }

    // ── reads into a struct ─────────────────────────────────────────────────────

    pub async fn fetch_all_as<T: FromAnyRow>(
        &self,
        sql: &str,
        params: Vec<DbValue>,
    ) -> Result<Vec<T>, sqlx::Error> {
        let prepared = self.prepare(sql)?;
        match self {
            DbPool::Pg(p) => bind_all!(sqlx::query_as::<_, T>(safe(prepared)), params)
                .fetch_all(p)
                .await,
            DbPool::My(p) => bind_all!(sqlx::query_as::<_, T>(safe(prepared)), params)
                .fetch_all(p)
                .await,
            DbPool::Sq(h) => {
                with_sqlite_retry(|| {
                    let sql = prepared.clone();
                    let params = params.clone();
                    let pool = h.pool.clone();
                    async move {
                        bind_all!(sqlx::query_as::<_, T>(safe(sql)), params)
                            .fetch_all(&pool)
                            .await
                    }
                })
                .await
            }
        }
    }

    pub async fn fetch_optional_as<T: FromAnyRow>(
        &self,
        sql: &str,
        params: Vec<DbValue>,
    ) -> Result<Option<T>, sqlx::Error> {
        let prepared = self.prepare(sql)?;
        match self {
            DbPool::Pg(p) => bind_all!(sqlx::query_as::<_, T>(safe(prepared)), params)
                .fetch_optional(p)
                .await,
            DbPool::My(p) => bind_all!(sqlx::query_as::<_, T>(safe(prepared)), params)
                .fetch_optional(p)
                .await,
            DbPool::Sq(h) => {
                with_sqlite_retry(|| {
                    let sql = prepared.clone();
                    let params = params.clone();
                    let pool = h.pool.clone();
                    async move {
                        bind_all!(sqlx::query_as::<_, T>(safe(sql)), params)
                            .fetch_optional(&pool)
                            .await
                    }
                })
                .await
            }
        }
    }

    pub async fn fetch_one_as<T: FromAnyRow>(
        &self,
        sql: &str,
        params: Vec<DbValue>,
    ) -> Result<T, sqlx::Error> {
        self.fetch_optional_as(sql, params)
            .await?
            .ok_or(sqlx::Error::RowNotFound)
    }

    // ── reads of a single scalar ────────────────────────────────────────────────

    pub async fn fetch_optional_scalar<T: ScalarAnyRow>(
        &self,
        sql: &str,
        params: Vec<DbValue>,
    ) -> Result<Option<T>, sqlx::Error> {
        let prepared = self.prepare(sql)?;
        match self {
            DbPool::Pg(p) => bind_all!(sqlx::query_scalar::<_, T>(safe(prepared)), params)
                .fetch_optional(p)
                .await,
            DbPool::My(p) => bind_all!(sqlx::query_scalar::<_, T>(safe(prepared)), params)
                .fetch_optional(p)
                .await,
            DbPool::Sq(h) => {
                with_sqlite_retry(|| {
                    let sql = prepared.clone();
                    let params = params.clone();
                    let pool = h.pool.clone();
                    async move {
                        bind_all!(sqlx::query_scalar::<_, T>(safe(sql)), params)
                            .fetch_optional(&pool)
                            .await
                    }
                })
                .await
            }
        }
    }

    pub async fn fetch_scalar<T: ScalarAnyRow>(
        &self,
        sql: &str,
        params: Vec<DbValue>,
    ) -> Result<T, sqlx::Error> {
        self.fetch_optional_scalar(sql, params)
            .await?
            .ok_or(sqlx::Error::RowNotFound)
    }

    // ── a row without a struct ──────────────────────────────────────────────────

    pub async fn fetch_optional_row(
        &self,
        sql: &str,
        params: Vec<DbValue>,
    ) -> Result<Option<DbRow>, sqlx::Error> {
        let prepared = self.prepare(sql)?;
        match self {
            DbPool::Pg(p) => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .fetch_optional(p)
                .await?
                .map(DbRow::Pg)),
            DbPool::My(p) => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .fetch_optional(p)
                .await?
                .map(DbRow::My)),
            DbPool::Sq(h) => {
                with_sqlite_retry(|| {
                    let sql = prepared.clone();
                    let params = params.clone();
                    let pool = h.pool.clone();
                    async move {
                        Ok(bind_all!(sqlx::query(safe(sql)), params)
                            .fetch_optional(&pool)
                            .await?
                            .map(DbRow::Sq))
                    }
                })
                .await
            }
        }
    }

    /// Every row of a query, without a target struct — for callers that map
    /// columns by name at run time (the portable backup writer). On SQLite this
    /// retries a transient `BUSY`/`LOCKED`.
    pub async fn fetch_all_row(
        &self,
        sql: &str,
        params: Vec<DbValue>,
    ) -> Result<Vec<DbRow>, sqlx::Error> {
        let prepared = self.prepare(sql)?;
        match self {
            DbPool::Pg(p) => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .fetch_all(p)
                .await?
                .into_iter()
                .map(DbRow::Pg)
                .collect()),
            DbPool::My(p) => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .fetch_all(p)
                .await?
                .into_iter()
                .map(DbRow::My)
                .collect()),
            DbPool::Sq(h) => {
                with_sqlite_retry(|| {
                    let sql = prepared.clone();
                    let params = params.clone();
                    let pool = h.pool.clone();
                    async move {
                        Ok(bind_all!(sqlx::query(safe(sql)), params)
                            .fetch_all(&pool)
                            .await?
                            .into_iter()
                            .map(DbRow::Sq)
                            .collect())
                    }
                })
                .await
            }
        }
    }

    // ── transactions ────────────────────────────────────────────────────────────

    /// Begins a transaction. On SQLite this takes the single-writer permit for
    /// the transaction's whole life, so write transactions serialise; it is
    /// released on commit, rollback or drop.
    pub async fn begin(&self) -> Result<DbTx, sqlx::Error> {
        match self {
            DbPool::Pg(p) => Ok(DbTx::Pg(p.begin().await?)),
            DbPool::My(p) => Ok(DbTx::My(p.begin().await?)),
            DbPool::Sq(h) => {
                let permit = h
                    .write
                    .clone()
                    .acquire_owned()
                    .await
                    .expect("write semaphore never closes");
                let tx = h.pool.begin().await?;
                Ok(DbTx::Sq { tx, _write: permit })
            }
        }
    }
}

/// An open transaction on whichever engine is in use.
pub enum DbTx {
    Pg(sqlx::Transaction<'static, Postgres>),
    My(sqlx::Transaction<'static, MySql>),
    Sq {
        tx: sqlx::Transaction<'static, Sqlite>,
        // Held for the transaction's whole life so SQLite writers serialise.
        _write: OwnedSemaphorePermit,
    },
}

impl DbTx {
    pub fn backend(&self) -> Backend {
        match self {
            DbTx::Pg(_) => Backend::Postgres,
            DbTx::My(_) => Backend::MySql,
            DbTx::Sq { .. } => Backend::Sqlite,
        }
    }

    fn prepare(&self, sql: &str) -> Result<String, sqlx::Error> {
        Ok(sql::prepare(sql, self.backend())
            .map_err(sql::into_sqlx_error)?
            .into_owned())
    }

    pub async fn execute(&mut self, sql: &str, params: Vec<DbValue>) -> Result<u64, sqlx::Error> {
        let prepared = self.prepare(sql)?;
        match self {
            DbTx::Pg(tx) => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .execute(&mut **tx)
                .await?
                .rows_affected()),
            DbTx::My(tx) => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .execute(&mut **tx)
                .await?
                .rows_affected()),
            DbTx::Sq { tx, .. } => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .execute(&mut **tx)
                .await?
                .rows_affected()),
        }
    }

    pub async fn fetch_optional_scalar<T: ScalarAnyRow>(
        &mut self,
        sql: &str,
        params: Vec<DbValue>,
    ) -> Result<Option<T>, sqlx::Error> {
        let prepared = self.prepare(sql)?;
        match self {
            DbTx::Pg(tx) => bind_all!(sqlx::query_scalar::<_, T>(safe(prepared)), params)
                .fetch_optional(&mut **tx)
                .await,
            DbTx::My(tx) => bind_all!(sqlx::query_scalar::<_, T>(safe(prepared)), params)
                .fetch_optional(&mut **tx)
                .await,
            DbTx::Sq { tx, .. } => bind_all!(sqlx::query_scalar::<_, T>(safe(prepared)), params)
                .fetch_optional(&mut **tx)
                .await,
        }
    }

    pub async fn fetch_optional_row(
        &mut self,
        sql: &str,
        params: Vec<DbValue>,
    ) -> Result<Option<DbRow>, sqlx::Error> {
        let prepared = self.prepare(sql)?;
        match self {
            DbTx::Pg(tx) => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .fetch_optional(&mut **tx)
                .await?
                .map(DbRow::Pg)),
            DbTx::My(tx) => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .fetch_optional(&mut **tx)
                .await?
                .map(DbRow::My)),
            DbTx::Sq { tx, .. } => Ok(bind_all!(sqlx::query(safe(prepared)), params)
                .fetch_optional(&mut **tx)
                .await?
                .map(DbRow::Sq)),
        }
    }

    pub async fn commit(self) -> Result<(), sqlx::Error> {
        match self {
            DbTx::Pg(tx) => tx.commit().await,
            DbTx::My(tx) => tx.commit().await,
            DbTx::Sq { tx, _write } => {
                let r = tx.commit().await;
                drop(_write);
                r
            }
        }
    }

    pub async fn rollback(self) -> Result<(), sqlx::Error> {
        match self {
            DbTx::Pg(tx) => tx.rollback().await,
            DbTx::My(tx) => tx.rollback().await,
            DbTx::Sq { tx, _write } => {
                let r = tx.rollback().await;
                drop(_write);
                r
            }
        }
    }
}

/// Wraps `AssertSqlSafe`: the text came out of [`crate::sql::prepare`], the only
/// place the platform builds SQL text at run time.
fn safe(sql: String) -> sqlx::AssertSqlSafe<String> {
    sqlx::AssertSqlSafe(sql)
}

/// Whether a sqlx error is a transient SQLite `BUSY` (5) or `LOCKED` (6).
fn is_sqlite_busy(e: &sqlx::Error) -> bool {
    e.as_database_error()
        .and_then(|d| d.code())
        .map(|c| c == "5" || c == "6")
        .unwrap_or(false)
}

/// Retries a SQLite operation on `BUSY`/`LOCKED` with bounded exponential
/// back-off. `busy_timeout` handles most contention inside the driver; this
/// catches what still surfaces.
async fn with_sqlite_retry<F, Fut, T>(mut f: F) -> Result<T, sqlx::Error>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, sqlx::Error>>,
{
    let mut delay = Duration::from_millis(20);
    let mut attempts = 0u32;
    loop {
        match f().await {
            Err(e) if attempts < 6 && is_sqlite_busy(&e) => {
                tokio::time::sleep(delay).await;
                delay = (delay * 2).min(Duration::from_millis(500));
                attempts += 1;
            }
            other => return other,
        }
    }
}
