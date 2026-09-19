//! What the three engines spell differently.
//!
//! Every helper here returns a SQL *fragment* meant to be interpolated into a
//! query that is then handed to [`crate::query`]. All identifier-shaped
//! parameters are `&'static str` on purpose: a value that cannot be produced
//! from an HTTP request without a deliberate leak. User data still goes through
//! bind parameters only.
//!
//! The fragments are written in PostgreSQL's `$n` placeholder style, because
//! that is the style [`crate::sql::prepare`] consumes.

use std::fmt::Write as _;

/// The engine this binary was compiled for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Backend {
    Postgres,
    MySql,
    Sqlite,
}

#[cfg(feature = "backend-postgres")]
pub const BACKEND: Backend = Backend::Postgres;
#[cfg(feature = "backend-mysql")]
pub const BACKEND: Backend = Backend::MySql;
#[cfg(feature = "backend-sqlite")]
pub const BACKEND: Backend = Backend::Sqlite;

/// MySQL and MariaDB have no `RETURNING` on `UPDATE`/`DELETE`, and MariaDB's
/// `INSERT ... RETURNING` does not survive `ON DUPLICATE KEY UPDATE`. Treat the
/// whole family as lacking it — see [`crate::returning`].
pub const SUPPORTS_RETURNING: bool = !matches!(BACKEND, Backend::MySql);

/// Whether the upsert clause can name *which* unique constraint it arbitrates.
/// MySQL's `ON DUPLICATE KEY UPDATE` fires on **any** unique index, which is a
/// real behavioural difference on a table with more than one.
pub const UPSERT_TARGETS_A_CONSTRAINT: bool = !matches!(BACKEND, Backend::MySql);

// ── casts ───────────────────────────────────────────────────────────────────

/// The target of a [`cast`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SqlType {
    BigInt,
    Int,
    Text,
    Double,
    /// A UUID column. PostgreSQL has a native type; MySQL stores `BINARY(16)`
    /// and SQLite a `BLOB`, where a cast is meaningless — the expression is
    /// returned unchanged there.
    Uuid,
}

/// `expr::bigint` and friends, in the local spelling.
pub fn cast(expr: &'static str, ty: SqlType) -> String {
    match (BACKEND, ty) {
        (Backend::Postgres, SqlType::BigInt) => format!("({expr})::bigint"),
        (Backend::Postgres, SqlType::Int) => format!("({expr})::int"),
        (Backend::Postgres, SqlType::Text) => format!("({expr})::text"),
        (Backend::Postgres, SqlType::Double) => format!("({expr})::double precision"),
        (Backend::Postgres, SqlType::Uuid) => format!("({expr})::uuid"),

        (Backend::MySql, SqlType::BigInt | SqlType::Int) => format!("CAST({expr} AS SIGNED)"),
        (Backend::MySql, SqlType::Text) => format!("CAST({expr} AS CHAR)"),
        (Backend::MySql, SqlType::Double) => format!("CAST({expr} AS DOUBLE)"),

        (Backend::Sqlite, SqlType::BigInt | SqlType::Int) => format!("CAST({expr} AS INTEGER)"),
        (Backend::Sqlite, SqlType::Text) => format!("CAST({expr} AS TEXT)"),
        (Backend::Sqlite, SqlType::Double) => format!("CAST({expr} AS REAL)"),

        // UUIDs are already binary on MySQL/SQLite: nothing to convert.
        (Backend::MySql | Backend::Sqlite, SqlType::Uuid) => expr.to_string(),
    }
}

// ── `= ANY($n)` ─────────────────────────────────────────────────────────────

/// A parenthesised list of placeholders for an `IN (...)`, replacing
/// PostgreSQL's `= ANY($n)` (arrays exist in no other engine).
///
/// `start` is the number of the first placeholder, 1-based, so a query that
/// already bound two values passes `3`. Bind the elements in order, right after
/// the earlier ones — [`crate::sql::prepare`] requires ascending `$n`.
///
/// An empty list yields `NULL`, so `x IN (NULL)` matches nothing on all three
/// engines. That is the correct answer and it avoids a syntax error.
///
/// ```ignore
/// let sql = format!("DELETE FROM drive.files WHERE owner_id = $1 AND id IN ({})",
///                   dialect::in_list(2, ids.len()));
/// let mut q = db::query(&sql)?.bind(owner);
/// for id in &ids { q = q.bind(id); }
/// ```
pub fn in_list(start: usize, count: usize) -> String {
    if count == 0 {
        return "NULL".to_string();
    }
    let mut s = String::with_capacity(count * 5);
    for n in start..start + count {
        if n > start {
            s.push_str(", ");
        }
        let _ = write!(s, "${n}");
    }
    s
}

// ── RETURNING ───────────────────────────────────────────────────────────────

/// `" RETURNING cols"`, or the empty string where the engine has no such
/// clause. Callers that need the value back on MySQL must use
/// [`crate::returning`].
pub fn returning(cols: &'static str) -> String {
    if SUPPORTS_RETURNING {
        format!(" RETURNING {cols}")
    } else {
        String::new()
    }
}

// ── upsert ──────────────────────────────────────────────────────────────────

/// One assignment in the update branch of an upsert.
#[derive(Debug, Clone, Copy)]
pub enum Assign {
    /// `col = <the value we tried to insert>`.
    Incoming(&'static str),
    /// `col = <expr>`, where `expr` may use two templates:
    /// `{cur}` for the column of the row already stored, and `{new}` for the
    /// column of the row we tried to insert.
    ///
    /// ```ignore
    /// Assign::Expr { col: "sync_version", expr: "{cur} + 1" }
    /// ```
    Expr {
        col: &'static str,
        expr: &'static str,
    },
}

/// The conflict clause of an `INSERT ... ON CONFLICT DO UPDATE`.
///
/// `table` is the *unqualified* table name: both PostgreSQL and SQLite expose
/// the stored row under it inside the update branch, and MySQL needs no prefix
/// at all.
///
/// ### MySQL caveat
/// `conflict_cols` is **ignored** on MySQL, whose `ON DUPLICATE KEY UPDATE`
/// reacts to any unique index on the table. On a table with a single unique
/// constraint the behaviour is identical; with several, it is not. Check
/// [`UPSERT_TARGETS_A_CONSTRAINT`] when that distinction matters.
pub fn upsert(table: &'static str, conflict_cols: &[&'static str], assigns: &[Assign]) -> String {
    let set = assigns
        .iter()
        .map(|a| match a {
            Assign::Incoming(col) => format!("{col} = {}", incoming(table, col)),
            Assign::Expr { col, expr } => {
                let body = expr
                    .replace("{cur}", &current(table, col))
                    .replace("{new}", &incoming(table, col));
                format!("{col} = {body}")
            }
        })
        .collect::<Vec<_>>()
        .join(", ");

    match BACKEND {
        Backend::Postgres | Backend::Sqlite => {
            format!(" ON CONFLICT ({}) DO UPDATE SET {set}", conflict_cols.join(", "))
        }
        Backend::MySql => format!(" ON DUPLICATE KEY UPDATE {set}"),
    }
}

/// How the engine names a column of the row that is already stored.
fn current(table: &'static str, col: &'static str) -> String {
    match BACKEND {
        Backend::Postgres | Backend::Sqlite => format!("{table}.{col}"),
        // Inside ON DUPLICATE KEY UPDATE a bare column name *is* the stored row.
        Backend::MySql => col.to_string(),
    }
}

/// How the engine names a column of the row we tried to insert.
fn incoming(_table: &'static str, col: &'static str) -> String {
    match BACKEND {
        Backend::Postgres | Backend::Sqlite => format!("excluded.{col}"),
        // VALUES() is deprecated in MySQL 8.0.20+ in favour of a row alias, but
        // it is the only spelling MariaDB and MySQL 5.7/8.0 all understand.
        Backend::MySql => format!("VALUES({col})"),
    }
}

/// `INSERT` ... "skip it if it is already there".
///
/// MySQL puts the marker in the *prefix* rather than in a trailing clause, so
/// both halves have to be composed:
///
/// ```ignore
/// let sql = format!(
///     "INSERT {}INTO chat.reads (message_id, user_id) VALUES ($1, $2){}",
///     dialect::insert_ignore_prefix(),
///     dialect::on_conflict_do_nothing(&["message_id", "user_id"]),
/// );
/// ```
///
/// ### Caveat
/// `INSERT IGNORE` downgrades *every* error on the statement to a warning
/// (truncation, bad foreign key…), not just the duplicate key. Where that
/// matters, insert inside a transaction and tolerate the duplicate-key error
/// instead.
pub fn insert_ignore_prefix() -> &'static str {
    match BACKEND {
        Backend::Postgres | Backend::Sqlite => "",
        Backend::MySql => "IGNORE ",
    }
}

/// The trailing half of the construct documented on [`insert_ignore_prefix`].
pub fn on_conflict_do_nothing(conflict_cols: &[&'static str]) -> String {
    match BACKEND {
        Backend::Postgres | Backend::Sqlite => {
            format!(" ON CONFLICT ({}) DO NOTHING", conflict_cols.join(", "))
        }
        Backend::MySql => String::new(),
    }
}

// ── JSON ────────────────────────────────────────────────────────────────────

/// Extracts a nested JSON value **as text**, PostgreSQL's `#>>`.
///
/// `path` is a list of object keys. Keys must be plain identifiers; a key with
/// a `'`, `"`, `$`, `.` or `[` in it is not supported and the function panics
/// in debug builds rather than build a fragment nobody audited. (Being
/// `&'static str`, such a key can only come from source code.)
pub fn json_text(col: &'static str, path: &[&'static str]) -> String {
    check_json_path(path);
    match BACKEND {
        Backend::Postgres => format!("{col} #>> '{{{}}}'", path.join(",")),
        Backend::MySql => format!("JSON_UNQUOTE(JSON_EXTRACT({col}, '{}'))", json_pointer(path)),
        Backend::Sqlite => format!("json_extract({col}, '{}')", json_pointer(path)),
    }
}

/// Extracts a nested JSON value **as JSON**, PostgreSQL's `#>`.
pub fn json_value(col: &'static str, path: &[&'static str]) -> String {
    check_json_path(path);
    match BACKEND {
        Backend::Postgres => format!("{col} #> '{{{}}}'", path.join(",")),
        Backend::MySql => format!("JSON_EXTRACT({col}, '{}')", json_pointer(path)),
        Backend::Sqlite => format!("json_extract({col}, '{}')", json_pointer(path)),
    }
}

/// Whether a JSON object has a key — PostgreSQL's `?` operator, which
/// [`crate::sql::prepare`] refuses because it collides with the placeholder.
pub fn json_has_key(col: &'static str, key: &'static str) -> String {
    check_json_path(&[key]);
    match BACKEND {
        Backend::Postgres => format!("jsonb_exists({col}, '{key}')"),
        Backend::MySql => format!("JSON_CONTAINS_PATH({col}, 'one', '$.{key}')"),
        Backend::Sqlite => format!("json_extract({col}, '$.{key}') IS NOT NULL"),
    }
}

/// Whether a JSON object has **any** of these keys — PostgreSQL's `?|`.
pub fn json_has_any_key(col: &'static str, keys: &[&'static str]) -> String {
    json_has_keys(col, keys, "one", " OR ")
}

/// Whether a JSON object has **all** of these keys — PostgreSQL's `?&`.
pub fn json_has_all_keys(col: &'static str, keys: &[&'static str]) -> String {
    json_has_keys(col, keys, "all", " AND ")
}

fn json_has_keys(
    col: &'static str,
    keys: &[&'static str],
    mysql_mode: &'static str,
    joiner: &'static str,
) -> String {
    check_json_path(keys);
    if keys.is_empty() {
        // `?|` over an empty array is false; `?&` is true. Both engines would
        // choke on an empty list, so emit the constant directly.
        return if mysql_mode == "one" { "FALSE".into() } else { "TRUE".into() };
    }
    match BACKEND {
        Backend::MySql => {
            let paths = keys.iter().map(|k| format!("'$.{k}'")).collect::<Vec<_>>().join(", ");
            format!("JSON_CONTAINS_PATH({col}, '{mysql_mode}', {paths})")
        }
        _ => {
            let parts =
                keys.iter().map(|k| format!("({})", json_has_key(col, k))).collect::<Vec<_>>();
            format!("({})", parts.join(joiner))
        }
    }
}

// ── aggregates ──────────────────────────────────────────────────────────────
//
// The return *type* of an aggregate is not the same on the three engines, and
// sqlx type-checks on decode. Normalising it here is what stops every module
// from rediscovering it:
//
// | expression   | PostgreSQL | MySQL           | SQLite  |
// |--------------|------------|-----------------|---------|
// | COUNT(*)     | bigint     | BIGINT UNSIGNED | INTEGER |
// | SUM(bigint)  | numeric    | DECIMAL         | INTEGER |
// | SUM(int)     | bigint     | DECIMAL         | INTEGER |
// | AVG(int)     | numeric    | DOUBLE          | REAL    |
//
// `numeric` and `DECIMAL` do not decode into `i64`/`f64` without the
// `bigdecimal`/`rust_decimal` features, so the cast is not cosmetic.

/// `SUM(expr)` decodable as `i64`, with `NULL` (no rows) turned into `0`.
pub fn sum_bigint(expr: &'static str) -> String {
    let coalesced = format!("COALESCE(SUM({expr}), 0)");
    cast_owned(&coalesced, SqlType::BigInt)
}

/// `COUNT(...)` decodable as `i64`. Pass `"*"` for a plain row count.
pub fn count_bigint(expr: &'static str) -> String {
    let counted = format!("COUNT({expr})");
    cast_owned(&counted, SqlType::BigInt)
}

/// `AVG(expr)` decodable as `f64`. Returns `NULL` when there are no rows, so
/// decode it as `Option<f64>`.
pub fn avg_double(expr: &'static str) -> String {
    let avg = format!("AVG({expr})");
    cast_owned(&avg, SqlType::Double)
}

/// [`cast`] over a fragment this module built itself. Not public: the
/// `&'static str` bound on [`cast`] is what keeps caller data out of the SQL
/// text, and it must not be loosened from the outside.
fn cast_owned(expr: &str, ty: SqlType) -> String {
    match (BACKEND, ty) {
        (Backend::Postgres, SqlType::BigInt) => format!("({expr})::bigint"),
        (Backend::Postgres, SqlType::Double) => format!("({expr})::double precision"),
        (Backend::MySql, SqlType::BigInt) => format!("CAST({expr} AS SIGNED)"),
        (Backend::MySql, SqlType::Double) => format!("CAST({expr} AS DOUBLE)"),
        (Backend::Sqlite, SqlType::BigInt) => format!("CAST({expr} AS INTEGER)"),
        (Backend::Sqlite, SqlType::Double) => format!("CAST({expr} AS REAL)"),
        _ => expr.to_string(),
    }
}

fn json_pointer(path: &[&'static str]) -> String {
    let mut s = String::from("$");
    for key in path {
        let _ = write!(s, ".{key}");
    }
    s
}

fn check_json_path(path: &[&'static str]) {
    debug_assert!(
        path.iter().all(|k| !k.is_empty()
            && k.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'_' || c == b'-')),
        "a JSON key must be a plain identifier: {path:?}"
    );
}

// ── time ────────────────────────────────────────────────────────────────────

/// The server-side "now".
///
/// **Prefer binding `chrono::Utc::now()` from Rust.** The three engines differ
/// in precision (MySQL truncates to the second unless asked otherwise) and in
/// time zone handling (SQLite has none), so a timestamp produced by the process
/// is both portable and easier to test. This exists for the cases where the
/// value has to be computed by the database, typically inside an upsert.
pub fn now() -> &'static str {
    match BACKEND {
        Backend::Postgres => "NOW()",
        Backend::MySql => "CURRENT_TIMESTAMP(6)",
        // sqlx decodes `%F %T%.f` into DateTime<Utc>; `strftime` is what gives
        // sub-second precision, CURRENT_TIMESTAMP alone truncates to the second.
        Backend::Sqlite => "strftime('%Y-%m-%d %H:%M:%f', 'now')",
    }
}

/// The unit of an [`interval_before`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Unit {
    Second,
    Minute,
    Hour,
    Day,
}

impl Unit {
    fn singular(self) -> &'static str {
        match self {
            Unit::Second => "second",
            Unit::Minute => "minute",
            Unit::Hour => "hour",
            Unit::Day => "day",
        }
    }
}

/// `NOW() - INTERVAL 'n unit'`, in the local spelling.
///
/// Same advice as [`now`]: binding a `DateTime<Utc>` computed in Rust is
/// clearer and testable. Use this only for a cut-off the database must evaluate
/// itself.
pub fn interval_before(n: u32, unit: Unit) -> String {
    let u = unit.singular();
    match BACKEND {
        Backend::Postgres => format!("NOW() - INTERVAL '{n} {u}'"),
        Backend::MySql => format!("CURRENT_TIMESTAMP(6) - INTERVAL {n} {}", u.to_uppercase()),
        Backend::Sqlite => format!("strftime('%Y-%m-%d %H:%M:%f', 'now', '-{n} {u}s')"),
    }
}

// ── assorted ────────────────────────────────────────────────────────────────

/// Case-insensitive `LIKE`. `n` is the placeholder number of the pattern.
///
/// MySQL's default collations and SQLite's `LIKE` are already case-insensitive
/// for ASCII; folding both sides keeps the behaviour identical for the accented
/// characters a French deployment will hit.
pub fn ilike(col: &'static str, n: usize) -> String {
    match BACKEND {
        Backend::Postgres => format!("{col} ILIKE ${n}"),
        Backend::MySql | Backend::Sqlite => format!("LOWER({col}) LIKE LOWER(${n})"),
    }
}

/// Concatenation of a group's values. `separator` is a literal, so it must not
/// contain a quote.
pub fn string_agg(expr: &'static str, separator: &'static str) -> String {
    debug_assert!(!separator.contains('\''), "separator must not contain a quote");
    match BACKEND {
        Backend::Postgres => format!("string_agg({expr}, '{separator}')"),
        Backend::MySql => format!("GROUP_CONCAT({expr} SEPARATOR '{separator}')"),
        Backend::Sqlite => format!("group_concat({expr}, '{separator}')"),
    }
}

/// Column types to use when writing the per-engine migration files. Kept here
/// so the three migration directories of a module stay consistent with what the
/// drivers actually encode.
pub mod column {
    use super::{Backend, BACKEND};

    /// `uuid::Uuid` — native on PostgreSQL, `BINARY(16)` on MySQL, `BLOB` on SQLite.
    pub const fn uuid() -> &'static str {
        match BACKEND {
            Backend::Postgres => "UUID",
            Backend::MySql => "BINARY(16)",
            Backend::Sqlite => "BLOB",
        }
    }

    /// `chrono::DateTime<Utc>`.
    pub const fn timestamptz() -> &'static str {
        match BACKEND {
            Backend::Postgres => "TIMESTAMPTZ",
            Backend::MySql => "DATETIME(6)",
            Backend::Sqlite => "TEXT",
        }
    }

    /// `serde_json::Value`.
    pub const fn json() -> &'static str {
        match BACKEND {
            Backend::Postgres => "JSONB",
            Backend::MySql => "JSON",
            Backend::Sqlite => "TEXT",
        }
    }

    /// `Vec<u8>`.
    pub const fn bytes() -> &'static str {
        match BACKEND {
            Backend::Postgres => "BYTEA",
            Backend::MySql => "LONGBLOB",
            Backend::Sqlite => "BLOB",
        }
    }

    /// Unbounded text. MySQL cannot index a `TEXT` without a prefix length, so
    /// a column that carries a unique key wants `VARCHAR(n)` there instead.
    pub const fn text() -> &'static str {
        match BACKEND {
            Backend::Postgres | Backend::Sqlite => "TEXT",
            Backend::MySql => "TEXT",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn in_list_numbers_from_the_offset() {
        assert_eq!(in_list(3, 3), "$3, $4, $5");
        assert_eq!(in_list(1, 1), "$1");
    }

    #[test]
    fn empty_in_list_matches_nothing_without_a_syntax_error() {
        assert_eq!(in_list(1, 0), "NULL");
    }

    #[test]
    fn in_list_feeds_a_valid_query() {
        let sql = format!("SELECT 1 WHERE id IN ({})", in_list(1, 2));
        assert!(crate::sql::prepare(&sql).is_ok());
    }

    #[test]
    fn returning_is_empty_only_on_mysql() {
        assert_eq!(returning("id").is_empty(), BACKEND == Backend::MySql);
    }

    #[test]
    fn upsert_uses_the_local_spelling() {
        let got = upsert(
            "vaults",
            &["owner_id"],
            &[
                Assign::Incoming("kdbx_path"),
                Assign::Expr { col: "sync_version", expr: "{cur} + 1" },
            ],
        );
        match BACKEND {
            Backend::Postgres | Backend::Sqlite => assert_eq!(
                got,
                " ON CONFLICT (owner_id) DO UPDATE SET \
                 kdbx_path = excluded.kdbx_path, sync_version = vaults.sync_version + 1"
            ),
            Backend::MySql => assert_eq!(
                got,
                " ON DUPLICATE KEY UPDATE \
                 kdbx_path = VALUES(kdbx_path), sync_version = sync_version + 1"
            ),
        }
    }

    #[test]
    fn json_text_uses_the_local_accessor() {
        let got = json_text("meta", &["a", "b"]);
        match BACKEND {
            Backend::Postgres => assert_eq!(got, "meta #>> '{a,b}'"),
            Backend::MySql => assert_eq!(got, "JSON_UNQUOTE(JSON_EXTRACT(meta, '$.a.b'))"),
            Backend::Sqlite => assert_eq!(got, "json_extract(meta, '$.a.b')"),
        }
    }

    #[test]
    fn every_fragment_survives_prepare() {
        // A fragment that `prepare` rejects would be unusable; guard the whole
        // surface at once rather than one test per helper.
        let fragments = vec![
            cast("a", SqlType::BigInt),
            cast("a", SqlType::Text),
            cast("a", SqlType::Uuid),
            returning("id"),
            upsert("t", &["id"], &[Assign::Incoming("a")]),
            on_conflict_do_nothing(&["id"]),
            json_text("m", &["k"]),
            json_value("m", &["k"]),
            json_has_key("m", "k"),
            json_has_any_key("m", &["a", "b"]),
            json_has_all_keys("m", &["a", "b"]),
            sum_bigint("size"),
            count_bigint("*"),
            avg_double("size"),
            now().to_string(),
            interval_before(7, Unit::Day),
            ilike("name", 1),
            string_agg("name", ", "),
        ];
        for f in fragments {
            // Not inside a comment: the point is to run the lexer over the real
            // text, so a fragment that smuggled in a `?` would be caught.
            let sql = format!("SELECT {f}");
            assert!(crate::sql::prepare(&sql).is_ok(), "fragment breaks prepare: {f}");
        }
    }
}
