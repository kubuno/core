//! Getting a row back from a write, on an engine that may not have `RETURNING`.
//!
//! PostgreSQL and SQLite (3.35+) both support `RETURNING`. MySQL and MariaDB do
//! not — MariaDB has `INSERT ... RETURNING`, but not on `UPDATE`/`DELETE` and
//! not in combination with `ON DUPLICATE KEY UPDATE`, so the whole family is
//! treated here as lacking it.
//!
//! # The prerequisite nobody can skip
//!
//! 295 Kubuno tables declare `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
//! The key is therefore invented by the database, and the only way the process
//! learns it is `RETURNING`. On MySQL there is no such way: `LAST_INSERT_ID()`
//! reports an `AUTO_INCREMENT` integer, which a UUID column is not.
//!
//! So a MySQL port is gated on a change that has nothing to do with this crate:
//! **the id must be generated in Rust** ([`crate::new_id`]) and bound like any
//! other column. The PostgreSQL `DEFAULT` can stay — a migration that has been
//! applied is frozen, and an explicit value overrides a default anyway.
//!
//! Once the key is known before the write, the three helpers below make the
//! call site identical on the three engines.
//!
//! # How they work
//!
//! * On PostgreSQL and SQLite: one statement, with `RETURNING` appended.
//! * On MySQL: two statements — the write, and a re-`SELECT` keyed on the
//!   primary key. They run on the connection you pass, so **wrap them in a
//!   transaction** or another session can slip between them.

use crate::{
    dialect, query,
    sql::{self},
    DbConnection, DbQuery, DbRow,
};
use sqlx::{Decode, Row, Type};

/// Insert a row and read it back.
///
/// * `insert_sql` — the `INSERT`, **without** any `RETURNING` clause. It must
///   bind the primary key explicitly (see [`crate::new_id`]).
/// * `returning_cols` — what `RETURNING` would have listed, e.g. `"*"` or
///   `"id, created_at"`.
/// * `reselect_sql` — how to find that same row again by primary key, used on
///   MySQL only, e.g. `"SELECT * FROM office.documents WHERE id = $1"`.
///
/// ```ignore
/// let id = kubuno_db::new_id();
/// let mut conn = state.db.acquire().await?;
/// let row = returning::insert_returning_row(
///     &mut conn,
///     "INSERT INTO office.documents (id, owner_id, title) VALUES ($1, $2, $3)",
///     "*",
///     |q| q.bind(id).bind(owner).bind(&title),
///     "SELECT * FROM office.documents WHERE id = $1",
///     |q| q.bind(id),
/// ).await?;
/// ```
pub async fn insert_returning_row<'a, BW, BS>(
    conn: &mut DbConnection,
    insert_sql: &str,
    returning_cols: &'static str,
    bind_insert: BW,
    reselect_sql: &str,
    bind_reselect: BS,
) -> Result<DbRow, sqlx::Error>
where
    BW: FnOnce(DbQuery<'a>) -> DbQuery<'a>,
    BS: FnOnce(DbQuery<'a>) -> DbQuery<'a>,
{
    write_then_read(
        conn,
        insert_sql,
        returning_cols,
        bind_insert,
        reselect_sql,
        bind_reselect,
    )
    .await?
    .ok_or(sqlx::Error::RowNotFound)
}

/// [`insert_returning_row`], decoding the single returned column.
pub async fn insert_returning_scalar<'a, T, BW, BS>(
    conn: &mut DbConnection,
    insert_sql: &str,
    returning_col: &'static str,
    bind_insert: BW,
    reselect_sql: &str,
    bind_reselect: BS,
) -> Result<T, sqlx::Error>
where
    T: for<'r> Decode<'r, crate::Db> + Type<crate::Db>,
    BW: FnOnce(DbQuery<'a>) -> DbQuery<'a>,
    BS: FnOnce(DbQuery<'a>) -> DbQuery<'a>,
{
    let row = insert_returning_row(
        conn,
        insert_sql,
        returning_col,
        bind_insert,
        reselect_sql,
        bind_reselect,
    )
    .await?;
    row.try_get(0)
}

/// Update a row and read the result back.
///
/// ### Limitation you must read
/// On MySQL the row is re-`SELECT`ed after the update, so `reselect_sql` has to
/// match it by **primary key** and nothing else. If you key the re-select on
/// the update's own guard (`WHERE status = 'draft'`) it will find nothing once
/// the update has changed that column.
///
/// The converse also bites: when the `UPDATE` matched no row, the re-select by
/// primary key still returns the untouched row, whereas PostgreSQL's
/// `RETURNING` would have returned nothing. For a *guarded* update — one whose
/// `WHERE` encodes a precondition — do not use this helper: take the row with
/// `SELECT ... FOR UPDATE` inside a transaction and decide in Rust. That
/// pattern is portable and says what it means.
pub async fn update_returning_row<'a, BW, BS>(
    conn: &mut DbConnection,
    update_sql: &str,
    returning_cols: &'static str,
    bind_update: BW,
    reselect_sql: &str,
    bind_reselect: BS,
) -> Result<Option<DbRow>, sqlx::Error>
where
    BW: FnOnce(DbQuery<'a>) -> DbQuery<'a>,
    BS: FnOnce(DbQuery<'a>) -> DbQuery<'a>,
{
    write_then_read(
        conn,
        update_sql,
        returning_cols,
        bind_update,
        reselect_sql,
        bind_reselect,
    )
    .await
}

/// Delete a row and read what was deleted.
///
/// Here the re-`SELECT` necessarily happens **before** the write, so on MySQL
/// the two statements must be in a transaction or a concurrent reader will see
/// a row this call is about to remove.
pub async fn delete_returning_row<'a, BW, BS>(
    conn: &mut DbConnection,
    delete_sql: &str,
    returning_cols: &'static str,
    bind_delete: BW,
    reselect_sql: &str,
    bind_reselect: BS,
) -> Result<Option<DbRow>, sqlx::Error>
where
    BW: FnOnce(DbQuery<'a>) -> DbQuery<'a>,
    BS: FnOnce(DbQuery<'a>) -> DbQuery<'a>,
{
    if dialect::SUPPORTS_RETURNING {
        let sql = format!("{delete_sql}{}", dialect::returning(returning_cols));
        let _ = (reselect_sql, bind_reselect);
        return bind_delete(query(&sql)?).fetch_optional(&mut *conn).await;
    }

    let existing = bind_reselect(query(reselect_sql)?)
        .fetch_optional(&mut *conn)
        .await?;
    bind_delete(query(delete_sql)?).execute(&mut *conn).await?;
    Ok(existing)
}

/// Shared body of the insert/update helpers: write, then read back.
async fn write_then_read<'a, BW, BS>(
    conn: &mut DbConnection,
    write_sql: &str,
    returning_cols: &'static str,
    bind_write: BW,
    reselect_sql: &str,
    bind_reselect: BS,
) -> Result<Option<DbRow>, sqlx::Error>
where
    BW: FnOnce(DbQuery<'a>) -> DbQuery<'a>,
    BS: FnOnce(DbQuery<'a>) -> DbQuery<'a>,
{
    if dialect::SUPPORTS_RETURNING {
        let sql = format!("{write_sql}{}", dialect::returning(returning_cols));
        // Unused on this backend; named so clippy does not flag them.
        let _ = (reselect_sql, bind_reselect);
        return bind_write(query(&sql)?).fetch_optional(&mut *conn).await;
    }

    bind_write(query(write_sql)?).execute(&mut *conn).await?;
    bind_reselect(query(reselect_sql)?)
        .fetch_optional(&mut *conn)
        .await
}

/// Runs the statements of a `RETURNING` emulation without a transaction being
/// required, for the single case where that is safe: an executor that is
/// already a transaction. Kept as a reminder in the type system — on MySQL,
/// `conn` should come from `tx.as_mut()`.
pub const NEEDS_TRANSACTION_ON_THIS_BACKEND: bool = !dialect::SUPPORTS_RETURNING;

/// Convenience for the common `WHERE id = $1` re-select, so the string is
/// written the same way everywhere.
///
/// Both parameters are `&'static str`: they are identifiers, never data.
pub fn reselect_by_id(table: &'static str, cols: &'static str) -> String {
    format!("SELECT {cols} FROM {table} WHERE id = $1")
}

/// Asserts at test time that a write statement was written without a literal
/// `RETURNING` — the helpers above append it themselves.
pub fn debug_assert_no_returning(sql: &str) {
    debug_assert!(
        !sql.to_ascii_lowercase().contains("returning"),
        "pass the statement without its RETURNING clause; the helper appends it: {sql}"
    );
    let _ = sql::lint(sql);
}
