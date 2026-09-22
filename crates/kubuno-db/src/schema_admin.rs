//! Administrative, whole-schema operations used by the core's database console:
//! renaming the global schema prefix in place, and copying every table of a
//! schema from one engine to another.
//!
//! These sit above the per-statement executor ([`crate::exec`]) because they act
//! on the *shape* of the database — its schemas, its tables, its rows read back
//! generically — rather than on one module's queries. Two features build on
//! them:
//!
//! * **Changing the schema prefix at run time** ([`rename_schema_prefix`]): the
//!   WordPress-style prefix ([`crate::schema::SchemaPrefix`]) is renamed on the
//!   live server so several instances can be re-namespaced without a dump/reload.
//! * **Switching a scope's engine while keeping its data** ([`copy_schema`]): a
//!   generic, type-preserving, table-by-table copy in foreign-key order, so the
//!   core (or a module) can move from PostgreSQL to MySQL or SQLite and back.
//!
//! Everything here reads rows without a target struct — the same generic path
//! the portable backup uses — and re-binds each cell as a typed [`DbValue`], so
//! the destination driver re-encodes it for its own engine.
//!
//! # Type fidelity across engines
//!
//! A value is read at the source engine's native shape and carried as a
//! [`DbValue`]; the destination coerces it into its column. PostgreSQL and MySQL
//! keep a UUID, a boolean and a timestamp as distinct types, so a copy *from*
//! one of them is fully faithful. SQLite has only storage classes (a UUID and a
//! hash are both `BLOB`, a boolean and a count both `INTEGER`), so copying *from*
//! SQLite *into* PostgreSQL cannot re-derive a `boolean` or a `uuid` column that
//! SQLite stored as `INTEGER`/`BLOB`. That is the one direction with a caveat,
//! and it is the same limitation the portable backup documents. Same-engine
//! copies and copies out of a richly-typed engine are exact.

use std::collections::{HashMap, HashSet, VecDeque};

use chrono::{DateTime, NaiveDate, NaiveDateTime, Utc};

use crate::dialect::Backend;
use crate::exec::{DbPool, DbRow};
use crate::params;
use crate::schema::KUBUNO_SCHEMAS;
use crate::value::DbValue;

/// Anything that can go wrong in a schema-wide administrative operation.
#[derive(Debug, thiserror::Error)]
pub enum AdminError {
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),
    /// A row count mismatch after a copy: the destination did not receive every
    /// source row, so the caller must not switch the pointer to it.
    #[error("copie incomplète de la table {table} : {expected} lignes attendues, {got} copiées")]
    RowCountMismatch {
        table: String,
        expected: i64,
        got: i64,
    },
    #[error("préfixe de schéma invalide : {0}")]
    BadPrefix(String),
}

// ─────────────────────────────────────────────────────────────────────────────
// Identifier safety
// ─────────────────────────────────────────────────────────────────────────────

/// A bare identifier fragment we are willing to interpolate into DDL (schema and
/// prefix names). Lowercase ASCII letters, digits and underscore only — the same
/// rule [`crate::schema::SchemaPrefix`] enforces, so nothing user-controlled can
/// carry a quote or a dot into a statement.
fn is_safe_ident(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 128
        && s.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_')
}

/// Double-quotes an identifier, doubling any embedded quote. Every identifier we
/// quote has already passed [`is_safe_ident`] or is a table/column name read
/// back from the catalog, so this is defence in depth rather than the only
/// guard.
fn quote_ident(s: &str) -> String {
    format!("\"{}\"", s.replace('"', "\"\""))
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema-prefix rename
// ─────────────────────────────────────────────────────────────────────────────

/// The effective (possibly prefixed) names of the Kubuno schemas that currently
/// exist under `prefix` on this server.
///
/// * PostgreSQL / MySQL: the server namespaces (schemas / databases) whose name
///   is `<prefix><known-schema>` for a schema in [`KUBUNO_SCHEMAS`].
/// * SQLite: always empty — a SQLite database has no server-level namespace to
///   rename (each schema is a file), so a prefix change is a no-op there.
pub async fn discover_prefixed_schemas(
    pool: &DbPool,
    prefix: &str,
) -> Result<Vec<String>, AdminError> {
    if !prefix.is_empty() && !is_safe_ident(prefix) {
        return Err(AdminError::BadPrefix(prefix.to_string()));
    }
    let existing: Vec<String> = match pool.backend() {
        Backend::Postgres => {
            // `information_schema.schemata` is not rewritten by the prefix layer
            // (it is not a Kubuno schema), so this sees the whole server.
            pool.fetch_all_as::<(String,)>(
                "SELECT schema_name FROM information_schema.schemata",
                params![],
            )
            .await?
            .into_iter()
            .map(|(n,)| n)
            .collect()
        }
        Backend::MySql => pool
            .fetch_all_as::<(String,)>(
                "SELECT schema_name FROM information_schema.schemata",
                params![],
            )
            .await?
            .into_iter()
            .map(|(n,)| n)
            .collect(),
        Backend::Sqlite => return Ok(Vec::new()),
    };

    // A server namespace belongs to this instance when, after stripping the
    // active prefix, its bare name is a known Kubuno schema OR a secondary schema
    // of one — `<root>_<suffix>`, e.g. `office_data`, which a module owns beyond
    // its primary schema. Matching a fixed list of primary names only (the old
    // behaviour) silently skipped those, leaving them un-renamed and the modules
    // that own them broken after a prefix change.
    let roots: HashSet<&str> = KUBUNO_SCHEMAS.iter().copied().collect();
    let owns = |bare: &str| roots.contains(bare)
        || roots.iter().any(|r| bare.len() > r.len() + 1
            && bare.as_bytes()[r.len()] == b'_'
            && &bare[..r.len()] == *r);
    Ok(existing
        .into_iter()
        .filter(|n| match n.strip_prefix(prefix) {
            Some(bare) => !bare.is_empty() && owns(bare),
            None => false,
        })
        .collect())
}

/// The outcome of a prefix rename: the bare schema names that were renamed from
/// `<old>` to `<new>`.
#[derive(Debug, Default, Clone)]
pub struct PrefixRename {
    /// Bare schema names (`core`, `notes`, …) whose namespace was renamed.
    pub renamed: Vec<String>,
    /// `true` when the engine has no server-level namespace (SQLite), so the
    /// rename was a no-op and the caller only needs to persist the new value.
    pub noop: bool,
}

/// Renames every Kubuno schema present under `old_prefix` to `new_prefix` on the
/// primary server, engine by engine, rolling back on failure.
///
/// * **PostgreSQL** — `ALTER SCHEMA "<old>s" RENAME TO "<new>s"` for each schema,
///   inside one transaction. PostgreSQL DDL is transactional, so any failure
///   rolls the whole set back automatically: the database is never left half
///   renamed.
/// * **MySQL/MariaDB** — a database cannot be renamed in one statement, so each
///   `<old>s` database is recreated as `<new>s` and every table moved with
///   `RENAME TABLE`. MySQL DDL is *not* transactional, so on failure this
///   compensates by moving the already-moved tables back and dropping what it
///   created.
/// * **SQLite** — a no-op ([`PrefixRename::noop`] is set): each schema is a file,
///   there is no server namespace to rename.
///
/// `old_prefix` and `new_prefix` are validated bare identifiers (or empty). The
/// caller is responsible for persisting `new_prefix` into the configuration and
/// for restarting the modules with it.
pub async fn rename_schema_prefix(
    pool: &DbPool,
    old_prefix: &str,
    new_prefix: &str,
) -> Result<PrefixRename, AdminError> {
    for p in [old_prefix, new_prefix] {
        if !p.is_empty() && !is_safe_ident(p) {
            return Err(AdminError::BadPrefix(p.to_string()));
        }
    }
    if old_prefix == new_prefix {
        return Ok(PrefixRename { renamed: Vec::new(), noop: false });
    }

    match pool.backend() {
        Backend::Sqlite => Ok(PrefixRename { renamed: Vec::new(), noop: true }),
        Backend::Postgres => rename_prefix_pg(pool, old_prefix, new_prefix).await,
        Backend::MySql => rename_prefix_mysql(pool, old_prefix, new_prefix).await,
    }
}

async fn rename_prefix_pg(
    pool: &DbPool,
    old: &str,
    new: &str,
) -> Result<PrefixRename, AdminError> {
    let present = discover_prefixed_schemas(pool, old).await?;
    let mut tx = pool.begin().await?;
    let mut renamed = Vec::new();
    for eff_old in &present {
        // `eff_old` is `<old><bare>`; the bare name is the tail after the prefix.
        let bare = eff_old.strip_prefix(old).unwrap_or(eff_old);
        let eff_new = format!("{new}{bare}");
        let sql = format!(
            "ALTER SCHEMA {} RENAME TO {}",
            quote_ident(eff_old),
            quote_ident(&eff_new)
        );
        if let Err(e) = tx.execute(&sql, params![]).await {
            tracing::error!(from = %eff_old, to = %eff_new, error = %e, "Renommage de schéma PostgreSQL échoué — rollback");
            // Dropping the transaction rolls every prior ALTER back.
            return Err(AdminError::Sqlx(e));
        }
        renamed.push(bare.to_string());
    }
    tx.commit().await?;
    Ok(PrefixRename { renamed, noop: false })
}

async fn rename_prefix_mysql(
    pool: &DbPool,
    old: &str,
    new: &str,
) -> Result<PrefixRename, AdminError> {
    let present = discover_prefixed_schemas(pool, old).await?;
    // Each entry: (bare, eff_old, eff_new, tables moved so far) — kept so a
    // mid-way failure can be undone (MySQL DDL does not roll back on its own).
    let mut done: Vec<(String, String, Vec<String>)> = Vec::new();

    for eff_old in &present {
        let bare = eff_old.strip_prefix(old).unwrap_or(eff_old).to_string();
        let eff_new = format!("{new}{bare}");
        if let Err(e) = move_mysql_database(pool, eff_old, &eff_new).await {
            tracing::error!(from = %eff_old, to = %eff_new, error = %e, "Renommage de base MySQL échoué — compensation");
            // Undo what already moved, in reverse.
            for (_bare, eff_new_done, tables) in done.iter().rev() {
                let eff_old_done = format!("{old}{}", eff_new_done.strip_prefix(new).unwrap_or(eff_new_done));
                undo_mysql_move(pool, eff_new_done, &eff_old_done, tables).await;
            }
            // Also undo the partial move of the failing database.
            let _ = pool
                .execute(&format!("DROP DATABASE IF EXISTS {}", quote_ident(&eff_new)), params![])
                .await;
            return Err(e);
        }
        let moved = mysql_table_names(pool, &eff_new).await.unwrap_or_default();
        done.push((bare, eff_new, moved));
    }

    Ok(PrefixRename {
        renamed: done.into_iter().map(|(b, _, _)| b).collect(),
        noop: false,
    })
}

/// Creates `<eff_new>` and moves every table of `<eff_old>` into it, then drops
/// the now-empty `<eff_old>`.
async fn move_mysql_database(pool: &DbPool, eff_old: &str, eff_new: &str) -> Result<(), AdminError> {
    pool.execute(&format!("CREATE DATABASE IF NOT EXISTS {}", quote_ident(eff_new)), params![])
        .await?;
    for table in mysql_table_names(pool, eff_old).await? {
        let sql = format!(
            "RENAME TABLE {}.{} TO {}.{}",
            quote_ident(eff_old),
            quote_ident(&table),
            quote_ident(eff_new),
            quote_ident(&table),
        );
        pool.execute(&sql, params![]).await?;
    }
    pool.execute(&format!("DROP DATABASE IF EXISTS {}", quote_ident(eff_old)), params![])
        .await?;
    Ok(())
}

/// Best-effort inverse of [`move_mysql_database`] used during compensation.
async fn undo_mysql_move(pool: &DbPool, eff_new: &str, eff_old: &str, tables: &[String]) {
    let _ = pool
        .execute(&format!("CREATE DATABASE IF NOT EXISTS {}", quote_ident(eff_old)), params![])
        .await;
    for table in tables {
        let sql = format!(
            "RENAME TABLE {}.{} TO {}.{}",
            quote_ident(eff_new),
            quote_ident(table),
            quote_ident(eff_old),
            quote_ident(table),
        );
        let _ = pool.execute(&sql, params![]).await;
    }
    let _ = pool
        .execute(&format!("DROP DATABASE IF EXISTS {}", quote_ident(eff_new)), params![])
        .await;
}

async fn mysql_table_names(pool: &DbPool, eff_db: &str) -> Result<Vec<String>, AdminError> {
    Ok(pool
        .fetch_all_as::<(String,)>(
            "SELECT table_name FROM information_schema.tables \
              WHERE table_schema = $1 AND table_type = 'BASE TABLE'",
            params![eff_db],
        )
        .await?
        .into_iter()
        .map(|(n,)| n)
        .collect())
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic cross-engine copy
// ─────────────────────────────────────────────────────────────────────────────

/// How one column's values are read from the source and re-bound onto the
/// destination. The read is engine-aware; the [`DbValue`] it produces is not.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Codec {
    Bool,
    /// A 16-bit integer (PostgreSQL `smallint`).
    I16,
    /// A 32-bit integer (PostgreSQL `integer`).
    I32,
    /// A 64-bit integer, and the width every MySQL/SQLite integer is read at.
    I64,
    /// A 32-bit float (PostgreSQL `real`, MySQL `float`). PostgreSQL is strict
    /// about float width, so `real` must be decoded as `f32`, not `f64`.
    F32,
    /// A 64-bit float (PostgreSQL `double precision`/`numeric`, and every
    /// SQLite float, which is always stored 8-byte).
    F64,
    Text,
    Blob,
    Uuid,
    Json,
    Date,
    /// A timestamp read as UTC. PostgreSQL `timestamptz` decodes to
    /// `DateTime<Utc>`; MySQL/SQLite decode to `NaiveDateTime` (already UTC).
    DateTime,
    /// A PostgreSQL `timestamp without time zone`, which decodes to
    /// `NaiveDateTime` even on PostgreSQL (there is no offset to apply).
    DateTimeNaive,
}

/// One copyable column: its name, the codec its values travel as, and the SQL
/// expression that reads it from the source (usually the quoted name, but a
/// PostgreSQL `citext`/`inet`/array is cast to a portable shape — `::text` or
/// `to_jsonb(...)` — so a driver that has no such type can still decode it).
struct Col {
    name: String,
    codec: Codec,
    read_expr: String,
}

/// One table's copyable columns, in order.
struct TableSpec {
    name: String,
    columns: Vec<Col>,
}

/// How many source rows one table held and how many reached the destination.
#[derive(Debug, Clone)]
pub struct TableCopy {
    pub table: String,
    pub rows: i64,
}

/// The result of [`copy_schema`].
#[derive(Debug, Clone, Default)]
pub struct CopyReport {
    pub tables: Vec<TableCopy>,
    pub total_rows: i64,
}

/// How many rows to carry per multi-row `INSERT`. Bounded so a very wide table
/// stays under any engine's bind-parameter limit (`batch * columns` parameters).
const DEFAULT_BATCH: usize = 200;

/// Copies every table of `src_schema` on `src` into `dst_schema` on `dst`,
/// preserving types, in foreign-key order, verifying row counts.
///
/// Both schema names are **effective** names — already carrying whatever prefix
/// applies — and are quoted literally, so neither pool's prefix layer rewrites
/// them a second time.
///
/// The destination tables must already exist (freshly migrated and empty is the
/// intended state): this copies data, it does not create schema. Each table is
/// emptied first (reverse foreign-key order) so a re-run is idempotent, then
/// filled in batches inside a single destination transaction with foreign-key
/// enforcement relaxed for the load. If any table's destination count does not
/// match the source, the whole transaction is rolled back and
/// [`AdminError::RowCountMismatch`] is returned — the caller must not switch to a
/// destination that did not receive everything.
///
/// `progress` is called after each table with its name and the running total of
/// rows copied, so a long copy can report where it is.
pub async fn copy_schema(
    src: &DbPool,
    src_schema: &str,
    dst: &DbPool,
    dst_schema: &str,
    progress: &mut (dyn FnMut(&str, i64) + Send),
) -> Result<CopyReport, AdminError> {
    let specs = table_specs(src, src_schema).await?;

    let mut tx = dst.begin().await?;
    // Relax foreign-key checks for the load, so tables can be emptied and
    // refilled without a mid-statement violation. PostgreSQL keeps its
    // non-deferrable constraints, satisfied by the parent-first copy order.
    match dst.backend() {
        Backend::MySql => {
            tx.execute("SET FOREIGN_KEY_CHECKS = 0", params![]).await?;
        }
        Backend::Sqlite => {
            tx.execute("PRAGMA defer_foreign_keys = ON", params![]).await?;
        }
        Backend::Postgres => {}
    }

    // Empty the destination in reverse dependency order first.
    for spec in specs.iter().rev() {
        let sql = format!("DELETE FROM {}.{}", quote_ident(dst_schema), quote_ident(&spec.name));
        tx.execute(&sql, params![]).await?;
    }

    let mut report = CopyReport::default();
    for spec in &specs {
        let rows = copy_one_table(src, src_schema, &mut tx, dst_schema, spec).await?;
        report.total_rows += rows;
        report.tables.push(TableCopy { table: spec.name.clone(), rows });
        progress(&spec.name, report.total_rows);
    }

    if dst.backend() == Backend::MySql {
        tx.execute("SET FOREIGN_KEY_CHECKS = 1", params![]).await?;
    }
    tx.commit().await?;

    // Verify counts on the committed destination: a silent short copy must never
    // pass for a successful engine switch.
    for spec in &specs {
        let src_count = table_count(src, src_schema, &spec.name).await?;
        let dst_count = table_count(dst, dst_schema, &spec.name).await?;
        if src_count != dst_count {
            return Err(AdminError::RowCountMismatch {
                table: spec.name.clone(),
                expected: src_count,
                got: dst_count,
            });
        }
    }

    Ok(report)
}

async fn table_count(pool: &DbPool, schema: &str, table: &str) -> Result<i64, AdminError> {
    let sql = format!("SELECT COUNT(*) FROM {}.{}", quote_ident(schema), quote_ident(table));
    Ok(pool.fetch_scalar::<i64>(&sql, params![]).await?)
}

/// Reads a table from the source in batches and writes it to the destination
/// transaction, returning the number of rows copied.
async fn copy_one_table(
    src: &DbPool,
    src_schema: &str,
    tx: &mut crate::exec::DbTx,
    dst_schema: &str,
    spec: &TableSpec,
) -> Result<i64, AdminError> {
    // The INSERT column list is the plain names; the SELECT list aliases each
    // read expression back to its column name so the row is keyed the same way.
    let insert_cols = spec
        .columns
        .iter()
        .map(|c| quote_ident(&c.name))
        .collect::<Vec<_>>()
        .join(", ");
    let select_cols = spec
        .columns
        .iter()
        .map(|c| format!("{} AS {}", c.read_expr, quote_ident(&c.name)))
        .collect::<Vec<_>>()
        .join(", ");
    let select = format!(
        "SELECT {select_cols} FROM {}.{}",
        quote_ident(src_schema),
        quote_ident(&spec.name)
    );
    let src_backend = src.backend();
    let rows = src.fetch_all_row(&select, params![]).await?;

    let ncols = spec.columns.len();
    let mut copied: i64 = 0;
    for chunk in rows.chunks(DEFAULT_BATCH.max(1)) {
        // Build a multi-row INSERT: VALUES ($1,…,$k),($k+1,…),…
        let mut values_sql = String::new();
        let mut binds: Vec<DbValue> = Vec::with_capacity(chunk.len() * ncols);
        for (r, row) in chunk.iter().enumerate() {
            if r > 0 {
                values_sql.push_str(", ");
            }
            values_sql.push('(');
            for (c, col) in spec.columns.iter().enumerate() {
                if c > 0 {
                    values_sql.push_str(", ");
                }
                let idx = r * ncols + c + 1;
                values_sql.push('$');
                values_sql.push_str(&idx.to_string());
                binds.push(read_cell(row, &col.name, col.codec, src_backend)?);
            }
            values_sql.push(')');
        }
        let insert = format!(
            "INSERT INTO {}.{} ({insert_cols}) VALUES {values_sql}",
            quote_ident(dst_schema),
            quote_ident(&spec.name)
        );
        tx.execute(&insert, binds).await?;
        copied += chunk.len() as i64;
    }
    Ok(copied)
}

/// Reads one column of one row into a typed [`DbValue`], choosing the concrete
/// Rust type by the source engine so the decode succeeds (PostgreSQL is strict
/// about integer width and timestamp offset; the others are lenient).
fn read_cell(
    row: &DbRow,
    name: &str,
    codec: Codec,
    backend: Backend,
) -> Result<DbValue, sqlx::Error> {
    Ok(match codec {
        Codec::Bool => DbValue::Bool(row.try_get::<Option<bool>>(name)?),
        Codec::I16 => DbValue::I16(row.try_get::<Option<i16>>(name)?),
        Codec::I32 => DbValue::I32(row.try_get::<Option<i32>>(name)?),
        Codec::I64 => DbValue::I64(row.try_get::<Option<i64>>(name)?),
        Codec::F32 => DbValue::F32(row.try_get::<Option<f32>>(name)?),
        Codec::F64 => DbValue::F64(row.try_get::<Option<f64>>(name)?),
        Codec::Text => DbValue::Text(row.try_get::<Option<String>>(name)?),
        Codec::Blob => DbValue::Blob(row.try_get::<Option<Vec<u8>>>(name)?),
        Codec::Uuid => DbValue::Uuid(row.try_get::<Option<uuid::Uuid>>(name)?),
        Codec::Json => DbValue::Json(row.try_get::<Option<serde_json::Value>>(name)?),
        Codec::Date => DbValue::NaiveDate(row.try_get::<Option<NaiveDate>>(name)?),
        Codec::DateTime => {
            // PostgreSQL's `timestamptz` decodes to `DateTime<Utc>`; MySQL's
            // `DATETIME` and SQLite's text timestamp decode to `NaiveDateTime`
            // (read as UTC — the session/write policy keeps every value UTC).
            let dt = match backend {
                Backend::Postgres => row.try_get::<Option<DateTime<Utc>>>(name)?,
                _ => row
                    .try_get::<Option<NaiveDateTime>>(name)?
                    .map(|n| DateTime::<Utc>::from_naive_utc_and_offset(n, Utc)),
            };
            DbValue::DateTimeUtc(dt)
        }
        Codec::DateTimeNaive => {
            let dt = row
                .try_get::<Option<NaiveDateTime>>(name)?
                .map(|n| DateTime::<Utc>::from_naive_utc_and_offset(n, Utc));
            DbValue::DateTimeUtc(dt)
        }
    })
}

// ── introspection ────────────────────────────────────────────────────────────

/// Every base table of `schema`, in a portable foreign-key order (parents
/// before children), each with its copyable columns and their codecs.
async fn table_specs(pool: &DbPool, schema: &str) -> Result<Vec<TableSpec>, AdminError> {
    let (names, edges) = match pool.backend() {
        Backend::Postgres => pg_tables_and_edges(pool, schema).await?,
        Backend::MySql => mysql_tables_and_edges(pool, schema).await?,
        Backend::Sqlite => sqlite_tables_and_edges(pool, schema).await?,
    };
    let ordered = topo_order(&names, &edges);

    let mut specs = Vec::with_capacity(ordered.len());
    for name in ordered {
        let columns = match pool.backend() {
            Backend::Postgres => pg_columns(pool, schema, &name).await?,
            Backend::MySql => mysql_columns(pool, schema, &name).await?,
            Backend::Sqlite => sqlite_columns(pool, schema, &name).await?,
        };
        if !columns.is_empty() {
            specs.push(TableSpec { name, columns });
        }
    }
    Ok(specs)
}

/// Kahn's algorithm: parents before children. Self-references are ignored and a
/// genuine cycle degrades to name order for the remainder.
fn topo_order(names: &[String], edges: &[(String, String)]) -> Vec<String> {
    let known: HashSet<&str> = names.iter().map(String::as_str).collect();
    let mut children: HashMap<String, Vec<String>> = HashMap::new();
    let mut indegree: HashMap<&str, usize> = names.iter().map(|n| (n.as_str(), 0)).collect();
    let mut seen: HashSet<(String, String)> = HashSet::new();

    for (parent, child) in edges {
        if parent == child || !known.contains(parent.as_str()) || !known.contains(child.as_str()) {
            continue;
        }
        if !seen.insert((parent.clone(), child.clone())) {
            continue;
        }
        children.entry(parent.clone()).or_default().push(child.clone());
        if let Some(d) = indegree.get_mut(child.as_str()) {
            *d += 1;
        }
    }

    let mut queue: VecDeque<String> = names
        .iter()
        .filter(|n| indegree.get(n.as_str()).copied().unwrap_or(0) == 0)
        .cloned()
        .collect();
    let mut ordered = Vec::with_capacity(names.len());
    while let Some(name) = queue.pop_front() {
        ordered.push(name.clone());
        for child in children.get(&name).into_iter().flatten() {
            if let Some(d) = indegree.get_mut(child.as_str()) {
                *d -= 1;
                if *d == 0 {
                    queue.push_back(child.clone());
                }
            }
        }
    }
    if ordered.len() < names.len() {
        for n in names {
            if !ordered.contains(n) {
                ordered.push(n.clone());
            }
        }
    }
    ordered
}

// PostgreSQL ------------------------------------------------------------------

async fn pg_tables_and_edges(
    pool: &DbPool,
    schema: &str,
) -> Result<(Vec<String>, Vec<(String, String)>), AdminError> {
    let names: Vec<String> = pool
        .fetch_all_as::<(String,)>(
            "SELECT table_name FROM information_schema.tables \
              WHERE table_schema = $1 AND table_type = 'BASE TABLE' \
                AND table_name <> '_sqlx_migrations'",
            params![schema],
        )
        .await?
        .into_iter()
        .map(|(n,)| n)
        .collect();

    let edges: Vec<(String, String)> = pool
        .fetch_all_as::<(String, String)>(
            "SELECT ccu.table_name AS parent, tc.table_name AS child \
               FROM information_schema.table_constraints tc \
               JOIN information_schema.constraint_column_usage ccu \
                 ON tc.constraint_name = ccu.constraint_name \
                AND tc.table_schema = ccu.table_schema \
              WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1",
            params![schema],
        )
        .await?;
    Ok((names, edges))
}

async fn pg_columns(
    pool: &DbPool,
    schema: &str,
    table: &str,
) -> Result<Vec<Col>, AdminError> {
    let rows: Vec<(String, String, String)> = pool
        .fetch_all_as(
            "SELECT column_name, data_type, udt_name FROM information_schema.columns \
              WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position",
            params![schema, table],
        )
        .await?;
    Ok(rows
        .into_iter()
        .map(|(name, data_type, udt)| pg_col(name, &data_type, &udt))
        .collect())
}

/// Maps one PostgreSQL column to a [`Col`], reading types a foreign driver has
/// no equivalent for through a portable cast so the copy still decodes them:
/// arrays become `jsonb`, and `citext`/`inet`/enums/domains become `text`.
fn pg_col(name: String, data_type: &str, udt: &str) -> Col {
    let q = quote_ident(&name);
    let (codec, read_expr) = match data_type.to_ascii_lowercase().as_str() {
        "boolean" => (Codec::Bool, q.clone()),
        "smallint" => (Codec::I16, q.clone()),
        "integer" => (Codec::I32, q.clone()),
        "bigint" => (Codec::I64, q.clone()),
        "real" => (Codec::F32, q.clone()),
        "double precision" | "numeric" => (Codec::F64, q.clone()),
        "uuid" => (Codec::Uuid, q.clone()),
        "json" | "jsonb" => (Codec::Json, q.clone()),
        "bytea" => (Codec::Blob, q.clone()),
        "date" => (Codec::Date, q.clone()),
        "timestamp with time zone" => (Codec::DateTime, q.clone()),
        "timestamp without time zone" => (Codec::DateTimeNaive, q.clone()),
        "time without time zone" | "time with time zone" => (Codec::Text, format!("{q}::text")),
        // A PostgreSQL array (`text[]`, `uuid[]`, …) has no equivalent on MySQL
        // or SQLite; `to_jsonb` turns it into a JSON array, the portable shape
        // the schema already uses for lists on the other engines.
        "array" => (Codec::Json, format!("to_jsonb({q})")),
        // `citext`, `inet`/`cidr`/`macaddr`, and any enum/domain: no generic
        // decode, but a `::text` cast reads faithfully into a text column.
        "inet" | "cidr" | "macaddr" | "macaddr8" | "user-defined" => {
            (Codec::Text, format!("{q}::text"))
        }
        // character varying / text / char / and anything else travels as text.
        _ => {
            let _ = udt;
            (Codec::Text, q.clone())
        }
    };
    Col { name, codec, read_expr }
}

// MySQL -----------------------------------------------------------------------

async fn mysql_tables_and_edges(
    pool: &DbPool,
    schema: &str,
) -> Result<(Vec<String>, Vec<(String, String)>), AdminError> {
    let names: Vec<String> = pool
        .fetch_all_as::<(String,)>(
            "SELECT table_name FROM information_schema.tables \
              WHERE table_schema = $1 AND table_type = 'BASE TABLE' \
                AND table_name <> '_sqlx_migrations'",
            params![schema],
        )
        .await?
        .into_iter()
        .map(|(n,)| n)
        .collect();

    let edges: Vec<(String, String)> = pool
        .fetch_all_as::<(String, String)>(
            "SELECT referenced_table_name AS parent, table_name AS child \
               FROM information_schema.key_column_usage \
              WHERE table_schema = $1 AND referenced_table_name IS NOT NULL",
            params![schema],
        )
        .await?;
    Ok((names, edges))
}

async fn mysql_columns(
    pool: &DbPool,
    schema: &str,
    table: &str,
) -> Result<Vec<Col>, AdminError> {
    let rows: Vec<(String, String, String)> = pool
        .fetch_all_as(
            "SELECT column_name, data_type, column_type FROM information_schema.columns \
              WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position",
            params![schema, table],
        )
        .await?;
    Ok(rows
        .into_iter()
        .map(|(name, data_type, column_type)| {
            let read_expr = quote_ident(&name);
            Col { codec: mysql_codec(&data_type, &column_type), name, read_expr }
        })
        .collect())
}

fn mysql_codec(data_type: &str, column_type: &str) -> Codec {
    match data_type.to_ascii_lowercase().as_str() {
        // BINARY(16) is Kubuno's UUID; other binary is opaque bytes.
        "binary" | "varbinary" if column_type.to_ascii_lowercase().contains("(16)") => Codec::Uuid,
        "binary" | "varbinary" | "blob" | "tinyblob" | "mediumblob" | "longblob" => Codec::Blob,
        // tinyint(1) is the boolean convention.
        "tinyint" if column_type.to_ascii_lowercase().contains("(1)") => Codec::Bool,
        "tinyint" | "smallint" | "mediumint" | "int" | "integer" | "bigint" => Codec::I64,
        "float" => Codec::F32,
        "decimal" | "numeric" | "double" => Codec::F64,
        "json" => Codec::Json,
        "datetime" | "timestamp" => Codec::DateTime,
        "date" => Codec::Date,
        _ => Codec::Text,
    }
}

// SQLite ----------------------------------------------------------------------

async fn sqlite_tables_and_edges(
    pool: &DbPool,
    schema: &str,
) -> Result<(Vec<String>, Vec<(String, String)>), AdminError> {
    let sql = format!(
        "SELECT name FROM {}.sqlite_master \
           WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> '_sqlx_migrations'",
        quote_ident(schema)
    );
    let names: Vec<String> = pool
        .fetch_all_as::<(String,)>(&sql, params![])
        .await?
        .into_iter()
        .map(|(n,)| n)
        .collect();

    let mut edges = Vec::new();
    for child in &names {
        // PRAGMA foreign_key_list returns: id, seq, table(parent), from, to, …
        let sql = format!(
            "PRAGMA {}.foreign_key_list({})",
            quote_ident(schema),
            quote_ident(child)
        );
        let fk_rows = pool.fetch_all_row(&sql, params![]).await?;
        for row in &fk_rows {
            if let Ok(parent) = row.try_get::<String>("table") {
                edges.push((parent, child.clone()));
            }
        }
    }
    Ok((names, edges))
}

async fn sqlite_columns(
    pool: &DbPool,
    schema: &str,
    table: &str,
) -> Result<Vec<Col>, AdminError> {
    let sql = format!(
        "PRAGMA {}.table_info({})",
        quote_ident(schema),
        quote_ident(table)
    );
    let rows = pool.fetch_all_row(&sql, params![]).await?;
    let mut out = Vec::new();
    for row in &rows {
        // table_info columns: cid, name, type, notnull, dflt_value, pk.
        let name: String = row.try_get("name")?;
        let decl: String = row.try_get("type")?;
        let read_expr = quote_ident(&name);
        out.push(Col { codec: sqlite_codec(&decl), name, read_expr });
    }
    Ok(out)
}

fn sqlite_codec(decl: &str) -> Codec {
    let d = decl.to_ascii_uppercase();
    if d.contains("INT") {
        Codec::I64
    } else if d.contains("BLOB") {
        Codec::Blob
    } else if d.contains("REAL") || d.contains("FLOA") || d.contains("DOUB") || d.contains("NUMERIC")
        || d.contains("DECIMAL")
    {
        Codec::F64
    } else {
        Codec::Text
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_ident_rules() {
        assert!(is_safe_ident("kub_"));
        assert!(is_safe_ident("core"));
        assert!(!is_safe_ident("Kub"));
        assert!(!is_safe_ident("a.b"));
        assert!(!is_safe_ident(""));
    }

    #[test]
    fn pg_codecs_by_type() {
        let codec = |dt: &str, udt: &str| pg_col("c".into(), dt, udt).codec;
        assert_eq!(codec("boolean", "bool"), Codec::Bool);
        assert_eq!(codec("smallint", "int2"), Codec::I16);
        assert_eq!(codec("integer", "int4"), Codec::I32);
        assert_eq!(codec("bigint", "int8"), Codec::I64);
        assert_eq!(codec("real", "float4"), Codec::F32);
        assert_eq!(codec("double precision", "float8"), Codec::F64);
        assert_eq!(codec("uuid", "uuid"), Codec::Uuid);
        assert_eq!(codec("jsonb", "jsonb"), Codec::Json);
        assert_eq!(codec("bytea", "bytea"), Codec::Blob);
        assert_eq!(codec("timestamp with time zone", "timestamptz"), Codec::DateTime);
        assert_eq!(codec("character varying", "varchar"), Codec::Text);
    }

    #[test]
    fn pg_exotic_types_are_cast_to_a_portable_shape() {
        // An array reads through `to_jsonb`, and citext/inet through `::text`,
        // so a driver without those types can still decode the copy.
        let arr = pg_col("tags".into(), "ARRAY", "_text");
        assert_eq!(arr.codec, Codec::Json);
        assert!(arr.read_expr.contains("to_jsonb"));
        let em = pg_col("email".into(), "USER-DEFINED", "citext");
        assert_eq!(em.codec, Codec::Text);
        assert!(em.read_expr.ends_with("::text"));
        let ip = pg_col("ip".into(), "inet", "inet");
        assert_eq!(ip.codec, Codec::Text);
        assert!(ip.read_expr.ends_with("::text"));
    }

    #[test]
    fn mysql_codecs_by_type() {
        assert_eq!(mysql_codec("binary", "binary(16)"), Codec::Uuid);
        assert_eq!(mysql_codec("binary", "binary(32)"), Codec::Blob);
        assert_eq!(mysql_codec("tinyint", "tinyint(1)"), Codec::Bool);
        assert_eq!(mysql_codec("int", "int"), Codec::I64);
        assert_eq!(mysql_codec("json", "json"), Codec::Json);
        assert_eq!(mysql_codec("datetime", "datetime(6)"), Codec::DateTime);
    }

    #[test]
    fn sqlite_codecs_by_decl() {
        assert_eq!(sqlite_codec("INTEGER"), Codec::I64);
        assert_eq!(sqlite_codec("BLOB"), Codec::Blob);
        assert_eq!(sqlite_codec("REAL"), Codec::F64);
        assert_eq!(sqlite_codec("TEXT"), Codec::Text);
    }

    #[test]
    fn topo_puts_parents_first() {
        let names = vec!["child".to_string(), "parent".to_string()];
        let edges = vec![("parent".to_string(), "child".to_string())];
        let ordered = topo_order(&names, &edges);
        let pi = ordered.iter().position(|n| n == "parent").unwrap();
        let ci = ordered.iter().position(|n| n == "child").unwrap();
        assert!(pi < ci, "parent must be ordered before child");
    }
}
