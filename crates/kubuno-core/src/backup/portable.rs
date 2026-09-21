//! The portable backup: an engine-neutral, data-only dump of the `core` schema
//! and the loader that reads it back.
//!
//! ## Why a second format
//!
//! PostgreSQL's dump ([`super::dump`]) is `COPY` text — fast, and loadable by the
//! `psql` that ships with the server. MySQL and SQLite have neither `COPY … TO
//! STDOUT` nor a `psql`, so a backup written for them has to be readable *in
//! process*, on any engine, with no external tool. This module is that: a
//! **NDJSON** stream (one JSON object per line) that names each table, its
//! columns and a per-column *codec*, then the rows as arrays of JSON scalars.
//!
//! Because every value is bound back through [`DbValue`] on restore, the loader
//! re-encodes it for whatever engine it is writing to. MySQL and SQLite store
//! the same shapes (a UUID is 16 bytes, JSON is text, a timestamp is a string,
//! a boolean is an integer), so a dump taken on one restores onto the other as
//! well as onto itself. PostgreSQL keeps its own `COPY` path.
//!
//! ## The format
//!
//! ```text
//! {"kubuno_dump":1,"schema":"core","engine":"sqlite","taken_at":"…","tables":["a","b"]}
//! {"table":"a","columns":[["id","uuid"],["name","text"]]}
//! {"cells":["4f…","Alice"]}
//! {"table":"b","columns":[…]}
//! …
//! ```
//!
//! ## What restore does
//!
//! It runs in a single transaction with foreign keys deferred (SQLite) or off
//! (MySQL): every table named in the header is emptied, then every dumped row is
//! inserted. The final state is exactly the dump — restoring onto a
//! freshly-migrated database (whose migrations seeded settings, roles and the
//! like) replaces those seeds with the backed-up rows rather than colliding with
//! them.

use std::collections::{HashMap, HashSet, VecDeque};
use std::path::Path;

use anyhow::{bail, Context};
use base64::Engine as _;
use chrono::{DateTime, NaiveDate, NaiveDateTime, Utc};
use kubuno_db::{params, DbPool, DbRow, DbValue};
use serde_json::{json, Value};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt};

use super::dump::{
    ensure_directory, free_bytes, DumpOutcome, ABORT_FREE_BYTES, MIN_FREE_BYTES, PARTIAL_SUFFIX,
};

/// The schema this feature backs up. The same constant [`super::dump`] uses.
const SCHEMA: &str = "core";

/// The base64 alphabet used for binary/UUID values.
const B64: base64::engine::general_purpose::GeneralPurpose = base64::engine::general_purpose::STANDARD;

/// How one column's values travel in the dump, and how they are bound back.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Codec {
    Bool,
    Int,
    Float,
    Text,
    Blob,
    Uuid,
    Json,
    Date,
    /// A wall-clock timestamp read as a string and re-bound as text; the engine
    /// coerces it into its DATETIME/TEXT column on insert.
    DateTime,
}

impl Codec {
    fn tag(self) -> &'static str {
        match self {
            Codec::Bool => "bool",
            Codec::Int => "int",
            Codec::Float => "float",
            Codec::Text => "text",
            Codec::Blob => "blob",
            Codec::Uuid => "uuid",
            Codec::Json => "json",
            Codec::Date => "date",
            Codec::DateTime => "datetime",
        }
    }

    fn from_tag(tag: &str) -> Codec {
        match tag {
            "bool" => Codec::Bool,
            "int" => Codec::Int,
            "float" => Codec::Float,
            "blob" => Codec::Blob,
            "uuid" => Codec::Uuid,
            "json" => Codec::Json,
            "date" => Codec::Date,
            "datetime" => Codec::DateTime,
            // "text" and anything unknown are safe as text.
            _ => Codec::Text,
        }
    }
}

/// One table's exportable columns, in order.
struct TableSpec {
    name: String,
    columns: Vec<(String, Codec)>,
}

/// The engine's name as it travels in the dump header.
fn backend_name(b: kubuno_db::Backend) -> &'static str {
    match b {
        kubuno_db::Backend::Postgres => "postgres",
        kubuno_db::Backend::MySql => "mysql",
        kubuno_db::Backend::Sqlite => "sqlite",
    }
}

// ── file naming ─────────────────────────────────────────────────────────────

/// The name a portable dump taken at `at` receives — the same sortable stamp as
/// the PostgreSQL dumps, with a `.ndjson` suffix so the two are told apart while
/// both being recognised by the retention pass.
pub fn file_name_for(at: DateTime<Utc>) -> String {
    format!("kubuno-core-{}.ndjson", at.format("%Y%m%dT%H%M%SZ"))
}

// ── writing ─────────────────────────────────────────────────────────────────

/// Writes one complete portable dump into `destination`.
pub async fn write_dump(db: &DbPool, destination: &Path) -> anyhow::Result<DumpOutcome> {
    ensure_directory(destination).await?;

    if let Some(free) = free_bytes(destination) {
        if free < MIN_FREE_BYTES {
            bail!(
                "Espace disque insuffisant sur {} : {} Mio disponibles, {} Mio requis",
                destination.display(),
                free / (1024 * 1024),
                MIN_FREE_BYTES / (1024 * 1024)
            );
        }
    }

    let started = Utc::now();
    let file_name = file_name_for(started);
    let final_path = destination.join(&file_name);
    let partial_path = destination.join(format!("{file_name}{PARTIAL_SUFFIX}"));

    match write_into(db, destination, &partial_path, started).await {
        Ok((tables, rows)) => {
            tokio::fs::rename(&partial_path, &final_path)
                .await
                .with_context(|| format!("Publication de {}", final_path.display()))?;
            let size_bytes = tokio::fs::metadata(&final_path).await.map(|m| m.len()).unwrap_or(0);
            Ok(DumpOutcome { file_name, path: final_path, size_bytes, tables, rows })
        }
        Err(e) => {
            if let Err(rm) = tokio::fs::remove_file(&partial_path).await {
                tracing::warn!(error = %rm, fichier = %partial_path.display(), "backup: fragment non supprimé");
            }
            Err(e)
        }
    }
}

async fn write_into(
    db: &DbPool,
    destination: &Path,
    partial_path: &Path,
    started: DateTime<Utc>,
) -> anyhow::Result<(usize, u64)> {
    let specs = table_specs(db).await?;

    let file = tokio::fs::File::create(partial_path)
        .await
        .with_context(|| format!("Création de {}", partial_path.display()))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        // The dump carries password hashes; lock it down before the first byte.
        if let Err(e) = file.set_permissions(std::fs::Permissions::from_mode(0o600)).await {
            tracing::warn!(error = %e, "backup: droits 0600 non appliqués au fichier");
        }
    }
    let mut out = tokio::io::BufWriter::with_capacity(256 * 1024, file);

    // Header line.
    let header = json!({
        "kubuno_dump": 1,
        "schema": SCHEMA,
        "engine": backend_name(db.backend()),
        "taken_at": started.to_rfc3339(),
        "tables": specs.iter().map(|s| s.name.clone()).collect::<Vec<_>>(),
    });
    write_line(&mut out, &header).await?;

    let mut total_rows: u64 = 0;
    for spec in &specs {
        if let Some(free) = free_bytes(destination) {
            if free < ABORT_FREE_BYTES {
                bail!(
                    "Sauvegarde interrompue : il ne reste que {} Mio sur {}",
                    free / (1024 * 1024),
                    destination.display()
                );
            }
        }

        let columns_meta: Vec<Value> = spec
            .columns
            .iter()
            .map(|(name, codec)| json!([name, codec.tag()]))
            .collect();
        write_line(&mut out, &json!({ "table": spec.name, "columns": columns_meta })).await?;

        let column_list = spec
            .columns
            .iter()
            .map(|(c, _)| format!("\"{}\"", c.replace('"', "\"\"")))
            .collect::<Vec<_>>()
            .join(", ");
        let sql = format!("SELECT {column_list} FROM core.\"{}\"", spec.name.replace('"', "\"\""));
        let rows = db
            .fetch_all_row(&sql, params![])
            .await
            .with_context(|| format!("Export de core.{}", spec.name))?;

        for row in &rows {
            let cells: Result<Vec<Value>, sqlx::Error> = spec
                .columns
                .iter()
                .map(|(name, codec)| read_cell(row, name, *codec))
                .collect();
            let cells = cells.with_context(|| format!("Lecture d'une ligne de core.{}", spec.name))?;
            write_line(&mut out, &json!({ "cells": cells })).await?;
            total_rows += 1;
        }
    }

    out.flush().await.context("Vidage du tampon d'écriture")?;
    out.into_inner().sync_all().await.context("Synchronisation du fichier de sauvegarde")?;
    Ok((specs.len(), total_rows))
}

async fn write_line<W: AsyncWriteExt + Unpin>(out: &mut W, value: &Value) -> anyhow::Result<()> {
    let mut line = serde_json::to_vec(value).context("Sérialisation d'une ligne du dump")?;
    line.push(b'\n');
    out.write_all(&line).await.context("Écriture d'une ligne du dump")?;
    Ok(())
}

/// Reads one column of one row into the JSON representation its codec dictates.
fn read_cell(row: &DbRow, name: &str, codec: Codec) -> Result<Value, sqlx::Error> {
    Ok(match codec {
        Codec::Bool => row.try_get::<Option<bool>>(name)?.map_or(Value::Null, Value::from),
        Codec::Int => row.try_get::<Option<i64>>(name)?.map_or(Value::Null, Value::from),
        Codec::Float => row.try_get::<Option<f64>>(name)?.map_or(Value::Null, Value::from),
        Codec::Text => row.try_get::<Option<String>>(name)?.map_or(Value::Null, Value::from),
        Codec::Blob => match row.try_get::<Option<Vec<u8>>>(name)? {
            Some(b) => Value::String(B64.encode(b)),
            None => Value::Null,
        },
        Codec::Uuid => match row.try_get::<Option<uuid::Uuid>>(name)? {
            Some(u) => Value::String(u.to_string()),
            None => Value::Null,
        },
        Codec::Json => row.try_get::<Option<Value>>(name)?.unwrap_or(Value::Null),
        Codec::Date => match row.try_get::<Option<NaiveDate>>(name)? {
            Some(d) => Value::String(d.format("%Y-%m-%d").to_string()),
            None => Value::Null,
        },
        Codec::DateTime => match row.try_get::<Option<NaiveDateTime>>(name)? {
            Some(dt) => Value::String(dt.format("%Y-%m-%d %H:%M:%S%.6f").to_string()),
            None => Value::Null,
        },
    })
}

// ── restore ─────────────────────────────────────────────────────────────────

/// Loads a portable NDJSON dump into `db`, replacing the current contents of
/// every table it names. Returns the number of rows inserted.
///
/// Runs in one transaction with foreign keys deferred (SQLite) or disabled
/// (MySQL): the tables are emptied and refilled as a unit, so a failure leaves
/// the database as it was.
pub async fn restore(db: &DbPool, path: &Path) -> anyhow::Result<u64> {
    let file = tokio::fs::File::open(path)
        .await
        .with_context(|| format!("Ouverture de {}", path.display()))?;
    let mut lines = tokio::io::BufReader::with_capacity(256 * 1024, file).lines();

    // First line: the header, which names every table so they can all be emptied
    // before anything is loaded.
    let first = lines
        .next_line()
        .await
        .context("Lecture de l'en-tête du dump")?
        .context("Dump vide : en-tête manquant")?;
    let header: Value = serde_json::from_str(&first).context("En-tête du dump illisible")?;
    if header.get("kubuno_dump").is_none() {
        bail!("Ce fichier n'est pas un dump portable Kubuno");
    }
    let tables: Vec<String> = header
        .get("tables")
        .and_then(|t| serde_json::from_value(t.clone()).ok())
        .unwrap_or_default();

    let mut tx = db.begin().await.context("Ouverture de la transaction de restauration")?;

    // Foreign keys off/deferred for the whole load, so tables can be emptied and
    // refilled in any order without a mid-statement violation.
    match db.backend() {
        kubuno_db::Backend::MySql => {
            tx.execute("SET FOREIGN_KEY_CHECKS = 0", params![]).await?;
        }
        kubuno_db::Backend::Sqlite => {
            tx.execute("PRAGMA defer_foreign_keys = ON", params![]).await?;
        }
        // PostgreSQL restores go through psql/the COPY dump, not this loader.
        kubuno_db::Backend::Postgres => {}
    }

    // Empty every table named in the header (reverse order, tidy even with FKs
    // off).
    for name in tables.iter().rev() {
        let sql = format!("DELETE FROM core.\"{}\"", name.replace('"', "\"\""));
        tx.execute(&sql, params![])
            .await
            .with_context(|| format!("Vidage de core.{name}"))?;
    }

    // Stream the rest: a table marker sets the current column codecs, each row
    // line is inserted at once.
    let mut current: Option<(String, Vec<(String, Codec)>)> = None;
    let mut inserted: u64 = 0;
    while let Some(line) = lines.next_line().await.context("Lecture d'une ligne du dump")? {
        if line.trim().is_empty() {
            continue;
        }
        let value: Value = serde_json::from_str(&line).context("Ligne du dump illisible")?;
        if let Some(table) = value.get("table").and_then(|t| t.as_str()) {
            let columns = parse_columns(value.get("columns"));
            current = Some((table.to_string(), columns));
        } else if let Some(cells) = value.get("cells").and_then(|c| c.as_array()) {
            let (table, columns) = current
                .as_ref()
                .context("Ligne de données avant toute déclaration de table")?;
            insert_row(&mut tx, table, columns, cells).await?;
            inserted += 1;
        }
    }

    if db.backend() == kubuno_db::Backend::MySql {
        tx.execute("SET FOREIGN_KEY_CHECKS = 1", params![]).await?;
    }
    tx.commit().await.context("Validation de la restauration")?;
    Ok(inserted)
}

fn parse_columns(value: Option<&Value>) -> Vec<(String, Codec)> {
    value
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|pair| {
                    let p = pair.as_array()?;
                    let name = p.first()?.as_str()?.to_string();
                    let codec = Codec::from_tag(p.get(1).and_then(|t| t.as_str()).unwrap_or("text"));
                    Some((name, codec))
                })
                .collect()
        })
        .unwrap_or_default()
}

async fn insert_row(
    tx: &mut kubuno_db::DbTx,
    table: &str,
    columns: &[(String, Codec)],
    cells: &[Value],
) -> anyhow::Result<()> {
    if columns.is_empty() {
        return Ok(());
    }
    let column_list = columns
        .iter()
        .map(|(c, _)| format!("\"{}\"", c.replace('"', "\"\"")))
        .collect::<Vec<_>>()
        .join(", ");
    let placeholders = (1..=columns.len()).map(|i| format!("${i}")).collect::<Vec<_>>().join(", ");
    let sql = format!(
        "INSERT INTO core.\"{}\" ({column_list}) VALUES ({placeholders})",
        table.replace('"', "\"\"")
    );
    let values: Vec<DbValue> = columns
        .iter()
        .enumerate()
        .map(|(i, (_, codec))| cell_to_dbvalue(*codec, cells.get(i).unwrap_or(&Value::Null)))
        .collect();
    tx.execute(&sql, values)
        .await
        .with_context(|| format!("Insertion dans core.{table}"))?;
    Ok(())
}

/// Binds one dumped cell back as the engine-agnostic value its codec dictates.
fn cell_to_dbvalue(codec: Codec, v: &Value) -> DbValue {
    if v.is_null() {
        // A typed NULL keeps the parameter's column type where the engine is
        // strict about it.
        return match codec {
            Codec::Bool => DbValue::Bool(None),
            Codec::Int => DbValue::I64(None),
            Codec::Float => DbValue::F64(None),
            Codec::Blob => DbValue::Blob(None),
            Codec::Uuid => DbValue::Uuid(None),
            Codec::Json => DbValue::Json(None),
            Codec::Date => DbValue::NaiveDate(None),
            Codec::Text | Codec::DateTime => DbValue::Text(None),
        };
    }
    match codec {
        Codec::Bool => DbValue::Bool(v.as_bool()),
        Codec::Int => DbValue::I64(v.as_i64()),
        Codec::Float => DbValue::F64(v.as_f64()),
        Codec::Text | Codec::DateTime => DbValue::Text(v.as_str().map(str::to_owned)),
        Codec::Blob => DbValue::Blob(v.as_str().and_then(|s| B64.decode(s).ok())),
        Codec::Uuid => DbValue::Uuid(v.as_str().and_then(|s| uuid::Uuid::parse_str(s).ok())),
        Codec::Json => DbValue::Json(Some(v.clone())),
        Codec::Date => DbValue::NaiveDate(
            v.as_str().and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok()),
        ),
    }
}

// ── schema introspection (MySQL / SQLite) ───────────────────────────────────

/// The tables of the `core` schema in a portable foreign-key order, each with
/// its exportable columns and their codecs.
async fn table_specs(db: &DbPool) -> anyhow::Result<Vec<TableSpec>> {
    let (names, edges) = match db.backend() {
        kubuno_db::Backend::MySql => mysql_tables_and_edges(db).await?,
        kubuno_db::Backend::Sqlite => sqlite_tables_and_edges(db).await?,
        kubuno_db::Backend::Postgres => {
            bail!("La sauvegarde portable est réservée à MySQL et SQLite")
        }
    };
    let ordered = topo_order(&names, &edges);

    let mut specs = Vec::with_capacity(ordered.len());
    for name in ordered {
        let columns = match db.backend() {
            kubuno_db::Backend::MySql => mysql_columns(db, &name).await?,
            kubuno_db::Backend::Sqlite => sqlite_columns(db, &name).await?,
            kubuno_db::Backend::Postgres => unreachable!(),
        };
        if columns.is_empty() {
            tracing::warn!(table = %name, "backup: table sans colonne exportable, ignorée");
            continue;
        }
        specs.push(TableSpec { name, columns });
    }
    Ok(specs)
}

/// Kahn's algorithm: parents before children. Self-references are skipped and a
/// genuine cycle degrades into "emit the rest in name order" — an incomplete
/// backup that says nothing is the one outcome to avoid.
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
        let missing: Vec<String> = names.iter().filter(|n| !ordered.contains(n)).cloned().collect();
        tracing::warn!(tables = ?missing, "backup: cycle de clés étrangères — tables écrites en fin");
        ordered.extend(missing);
    }
    ordered
}

#[derive(sqlx::FromRow)]
struct NameRow {
    name: String,
}

#[derive(sqlx::FromRow)]
struct EdgeRow {
    parent: String,
    child: String,
}

async fn mysql_tables_and_edges(db: &DbPool) -> anyhow::Result<(Vec<String>, Vec<(String, String)>)> {
    let tables: Vec<NameRow> = db
        .fetch_all_as(
            "SELECT table_name AS name FROM information_schema.tables \
              WHERE table_schema = 'core' AND table_type = 'BASE TABLE' \
                AND table_name <> '_sqlx_migrations'",
            params![],
        )
        .await
        .context("Lecture de la liste des tables (MySQL)")?;
    let names: Vec<String> = tables.into_iter().map(|r| r.name).collect();

    let edges: Vec<EdgeRow> = db
        .fetch_all_as(
            "SELECT referenced_table_name AS parent, table_name AS child \
               FROM information_schema.key_column_usage \
              WHERE table_schema = 'core' AND referenced_table_name IS NOT NULL",
            params![],
        )
        .await
        .context("Lecture des clés étrangères (MySQL)")?;
    Ok((names, edges.into_iter().map(|e| (e.parent, e.child)).collect()))
}

#[derive(sqlx::FromRow)]
struct MysqlColRow {
    name: String,
    data_type: String,
    column_type: String,
}

async fn mysql_columns(db: &DbPool, table: &str) -> anyhow::Result<Vec<(String, Codec)>> {
    let rows: Vec<MysqlColRow> = db
        .fetch_all_as(
            "SELECT column_name AS name, data_type, column_type \
               FROM information_schema.columns \
              WHERE table_schema = 'core' AND table_name = $1 \
              ORDER BY ordinal_position",
            params![table],
        )
        .await
        .with_context(|| format!("Lecture des colonnes de core.{table} (MySQL)"))?;
    Ok(rows
        .into_iter()
        .map(|c| (c.name, mysql_codec(&c.data_type, &c.column_type)))
        .collect())
}

fn mysql_codec(data_type: &str, column_type: &str) -> Codec {
    match data_type.to_ascii_lowercase().as_str() {
        // BINARY(16) is Kubuno's UUID representation; other binary is opaque bytes.
        "binary" | "varbinary" if column_type.to_ascii_lowercase().contains("(16)") => Codec::Uuid,
        "binary" | "varbinary" | "blob" | "tinyblob" | "mediumblob" | "longblob" => Codec::Blob,
        "tinyint" | "smallint" | "mediumint" | "int" | "integer" | "bigint" => Codec::Int,
        "decimal" | "numeric" | "float" | "double" => Codec::Float,
        "json" => Codec::Json,
        "datetime" | "timestamp" => Codec::DateTime,
        "date" => Codec::Date,
        // char/varchar/text/enum/set/time/year and anything else travel as text.
        _ => Codec::Text,
    }
}

#[derive(sqlx::FromRow)]
struct SqliteFkRow {
    #[sqlx(rename = "table")]
    parent: String,
}

async fn sqlite_tables_and_edges(
    db: &DbPool,
) -> anyhow::Result<(Vec<String>, Vec<(String, String)>)> {
    let tables: Vec<NameRow> = db
        .fetch_all_as(
            "SELECT name FROM core.sqlite_master \
              WHERE type = 'table' AND name NOT LIKE 'sqlite_%' \
                AND name <> '_sqlx_migrations'",
            params![],
        )
        .await
        .context("Lecture de la liste des tables (SQLite)")?;
    let names: Vec<String> = tables.into_iter().map(|r| r.name).collect();

    let mut edges = Vec::new();
    for child in &names {
        let sql = format!("PRAGMA core.foreign_key_list(\"{}\")", child.replace('"', "\"\""));
        let fks: Vec<SqliteFkRow> = db
            .fetch_all_as(&sql, params![])
            .await
            .with_context(|| format!("Lecture des clés étrangères de core.{child} (SQLite)"))?;
        for fk in fks {
            edges.push((fk.parent, child.clone()));
        }
    }
    Ok((names, edges))
}

#[derive(sqlx::FromRow)]
struct SqliteColRow {
    name: String,
    #[sqlx(rename = "type")]
    col_type: String,
}

async fn sqlite_columns(db: &DbPool, table: &str) -> anyhow::Result<Vec<(String, Codec)>> {
    let sql = format!("PRAGMA core.table_info(\"{}\")", table.replace('"', "\"\""));
    let rows: Vec<SqliteColRow> = db
        .fetch_all_as(&sql, params![])
        .await
        .with_context(|| format!("Lecture des colonnes de core.{table} (SQLite)"))?;
    Ok(rows.into_iter().map(|c| (c.name, sqlite_codec(&c.col_type))).collect())
}

/// SQLite's declared type carries only a storage class. A UUID and a hash both
/// live in a `BLOB`, a timestamp and a name both in `TEXT`: the dump keeps the
/// storage faithful, which round-trips on SQLite and, because MySQL stores the
/// same shapes, onto MySQL too.
fn sqlite_codec(decl: &str) -> Codec {
    let d = decl.to_ascii_uppercase();
    if d.contains("INT") {
        Codec::Int
    } else if d.contains("BLOB") {
        Codec::Blob
    } else if d.contains("REAL") || d.contains("FLOA") || d.contains("DOUB") || d.contains("NUMERIC")
        || d.contains("DECIMAL")
    {
        Codec::Float
    } else {
        // TEXT, and the SQLite default affinity, travel as text.
        Codec::Text
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn codec_tags_round_trip() {
        for c in [
            Codec::Bool,
            Codec::Int,
            Codec::Float,
            Codec::Text,
            Codec::Blob,
            Codec::Uuid,
            Codec::Json,
            Codec::Date,
            Codec::DateTime,
        ] {
            assert_eq!(Codec::from_tag(c.tag()), c);
        }
        // An unknown tag is text, never a panic.
        assert_eq!(Codec::from_tag("mystery"), Codec::Text);
    }

    #[test]
    fn mysql_binary_16_is_a_uuid_but_other_binary_is_bytes() {
        assert_eq!(mysql_codec("binary", "binary(16)"), Codec::Uuid);
        assert_eq!(mysql_codec("binary", "binary(32)"), Codec::Blob);
        assert_eq!(mysql_codec("json", "json"), Codec::Json);
        assert_eq!(mysql_codec("datetime", "datetime(6)"), Codec::DateTime);
        assert_eq!(mysql_codec("bigint", "bigint"), Codec::Int);
        assert_eq!(mysql_codec("varchar", "varchar(255)"), Codec::Text);
    }

    #[test]
    fn sqlite_storage_classes_map_to_codecs() {
        assert_eq!(sqlite_codec("BLOB"), Codec::Blob);
        assert_eq!(sqlite_codec("TEXT"), Codec::Text);
        assert_eq!(sqlite_codec("INTEGER"), Codec::Int);
        assert_eq!(sqlite_codec("REAL"), Codec::Float);
        assert_eq!(sqlite_codec("NUMERIC"), Codec::Float);
    }

    #[test]
    fn a_uuid_cell_round_trips_through_the_codec() {
        let id = uuid::Uuid::new_v4();
        let cell = Value::String(id.to_string());
        match cell_to_dbvalue(Codec::Uuid, &cell) {
            DbValue::Uuid(Some(u)) => assert_eq!(u, id),
            other => panic!("attendu Uuid, obtenu {other:?}"),
        }
    }
}
