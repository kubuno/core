# kubuno-db

The database foundation shared by the Kubuno core and every module: one
compile-time backend — **PostgreSQL**, **MySQL/MariaDB** or **SQLite** — behind
one set of types, with a dialect layer for everything the three engines spell
differently.

```toml
kubuno-db = { git = "https://github.com/kubuno/core", tag = "db-v0.1.0", package = "kubuno-db", default-features = false }
```

---

## 1. The design, and why

### One backend per binary, selected by a cargo feature

`kubuno_db::Db` is a type alias — `sqlx::Postgres`, `sqlx::MySql` or
`sqlx::Sqlite` — picked by the feature the crate was built with. Everything else
follows from it: `DbPool`, `DbRow`, `DbTransaction`, `DbQuery`.

The two alternatives were rejected for concrete reasons:

* **Generic over `sqlx::Database`.** Every function that binds a value would
  have to carry the bounds that make it bindable — `for<'a> Uuid: Encode<'a, DB>`,
  `Uuid: Type<DB>`, and one more pair per type. Those bounds are viral: they
  climb from the query into the service, the handler, and `AppState`, which
  Axum then has to be generic over too. Kubuno binds a `Uuid` in 5178 places.
* **`sqlx::Any`.** It carries only Null/Bool/SmallInt/Integer/BigInt/Real/
  Double/Text/Blob. The three types Kubuno uses most — `Uuid` (5178
  occurrences), `serde_json::Value` (2353), `DateTime<Utc>` (628) — cannot
  cross it at all.

With the alias, sqlx infers the database from the executor, so
`sqlx::query(...).bind(id).fetch_one(&state.db)` keeps compiling unchanged. A
module's diff is limited to its SQL text and to `PgPool` → `DbPool`.

**The price, stated plainly:** the engine is baked into the artefact. A module
ships one `.kbpkg` per engine, and an instance cannot change engine without
reinstalling. The build matrix grows from `os × arch` to `os × arch × engine`.

### Exactly one backend

Cargo features are additive, so this is checked rather than assumed: enabling
two backends is a `compile_error!`, and so is enabling none. A consumer that
wants anything but PostgreSQL must pass `default-features = false`.

---

## 2. Porting a module: the checklist

### 2.1 `Cargo.toml`

```toml
[features]
default          = ["backend-postgres"]
backend-postgres = ["kubuno-db/backend-postgres", "sqlx/postgres"]
backend-mysql    = ["kubuno-db/backend-mysql",    "sqlx/mysql"]
backend-sqlite   = ["kubuno-db/backend-sqlite",   "sqlx/sqlite"]
```

`sqlx/<driver>` **must** be switched here too. Leaving `postgres` in sqlx's
own feature list would link the PostgreSQL driver into every build, and cargo
would happily unify it back on.

```toml
[workspace.dependencies]
sqlx = { version = "0.9", default-features = false, features = [
    "runtime-tokio", "tls-rustls", "uuid", "chrono", "json", "migrate",
    "derive", "macros",
] }
kubuno-db = { git = "https://github.com/kubuno/core", tag = "db-v0.1.0", package = "kubuno-db", default-features = false }
```

`derive` and `macros` are in sqlx's *default* features, which
`default-features = false` has just removed — a module using `#[derive(FromRow)]`
needs them back.

### 2.2 Declare the schema once

```rust
// src/lib.rs
pub const SCHEMA: &str = "keestore";
```

### 2.3 Types

| before | after |
|---|---|
| `sqlx::PgPool` | `kubuno_db::DbPool` |
| `sqlx::postgres::PgRow` | `kubuno_db::DbRow` |
| `sqlx::Transaction<'_, sqlx::Postgres>` | `kubuno_db::DbTransaction<'_>` |
| `sqlx::postgres::PgConnection` | `kubuno_db::DbConnection` |

### 2.4 Queries

`sqlx::query(...)` → `kubuno_db::query(...)?`. The `?` is the whole difference:
the function returns `Result<_, sqlx::Error>`, so any error enum that already
has `#[from] sqlx::Error` absorbs it without a new variant.

```rust
let row = kubuno_db::query("SELECT * FROM keestore.vaults WHERE owner_id = $1")?
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;
```

Keep writing `$1`, `$2` — PostgreSQL's style is the source dialect, translated
to `?` where the engine wants it. Same for `query_as` and `query_scalar`.

### 2.5 Connecting, migrating

```rust
let pool = kubuno_db::connect(&settings.database, SCHEMA).await?;   // also creates the schema

if settings.database.run_migrations {
    let m = kubuno_db::migrations!(
        "./migrations/postgres", "./migrations/mysql", "./migrations/sqlite",
    );
    kubuno_db::pool::scope_migrator(m, SCHEMA).run(&pool).await?;
}

kubuno_db::events::ensure_outbox(&pool, SCHEMA).await?;   // no-op on PostgreSQL
```

Replace the module's `DatabaseSettings` with `kubuno_db::DbSettings` (field for
field what the modules already deserialise, plus `path` for SQLite). The
separate `search_path` migration pool goes away: `scope_migrator` puts
`_sqlx_migrations` in `<schema>._sqlx_migrations`, which is where PostgreSQL
already had it.

### 2.6 Migrations: three directories

Move the existing files to `migrations/postgres/` **unchanged** — same
filenames, same bytes, so the version, description and checksum are identical
and an applied migration stays applied. Then write the MySQL and SQLite
versions.

| Rust type | PostgreSQL | MySQL/MariaDB | SQLite |
|---|---|---|---|
| `Uuid` | `UUID` | `BINARY(16)` | `BLOB` |
| `DateTime<Utc>` | `TIMESTAMPTZ` | `DATETIME(6)` | `TEXT` (`%F %T%.f`, UTC) |
| `serde_json::Value` | `JSONB` | `JSON` | `TEXT` |
| `Vec<String>` / `Vec<Uuid>` (a small list) | `JSONB` | `JSON` | `TEXT` — as a JSON array; see §2.8 |
| `Vec<u8>` | `BYTEA` | `LONGBLOB` | `BLOB` |
| `String` (indexed/unique) | `TEXT` | `VARCHAR(n)` — MySQL cannot index a `TEXT` without a prefix length | `TEXT` |

`dialect::column::*` returns these, so a generated migration and a hand-written
one cannot drift.

Other per-engine differences: `CREATE SCHEMA` disappears (kubuno-db does it),
`DEFAULT gen_random_uuid()` disappears (see §3), and an `updated_at` trigger
becomes `ON UPDATE CURRENT_TIMESTAMP(6)` on MySQL and a hand-written trigger on
SQLite.

> ⚠️ Several PostgreSQL migrations depend on extensions the **core** creates
> (`uuid-ossp`, `pg_trgm`, `unaccent`, `citext`). There is no equivalent on the
> other engines: `CITEXT` becomes a case-insensitive collation on MySQL and
> `COLLATE NOCASE` on SQLite, and trigram search has no replacement at all.

### 2.7 SQL to rewrite

Run `kubuno_db::lint(sql)` over the module's statements in a unit test; it names
each non-portable construct and the helper that replaces it.

| PostgreSQL | replacement |
|---|---|
| `x = ANY($n)` (an `IN`-list of bound values) | `format!("x IN ({})", dialect::in_list(start, n))` + one `.bind()` per element |
| `x = ANY(col)` (`col` is a `TEXT[]`/`UUID[]` **column**) | store the column as a JSON array and filter with `Backend::json_array_contains("col", n)` — see §2.8 |
| `expr::bigint` | `dialect::cast("expr", SqlType::BigInt)` |
| `SUM(c)`, `COUNT(*)`, `AVG(c)` | `dialect::sum_bigint`, `count_bigint`, `avg_double` — the *return type* differs per engine (see §4) |
| `ON CONFLICT (a) DO UPDATE SET ...` | `dialect::upsert(table, &["a"], &[Assign::…])` |
| `ON CONFLICT DO NOTHING` | `dialect::insert_ignore_prefix()` **and** `dialect::on_conflict_do_nothing(&[...])` — MySQL puts its marker in the prefix |
| `RETURNING ...` | `kubuno_db::returning::*` (see §3) |
| `col->>'k'`, `col#>>'{a,b}'` | `dialect::json_text("col", &["a", "b"])` |
| `col ? 'k'`, `?|`, `?&` | `dialect::json_has_key` / `json_has_any_key` / `json_has_all_keys` |
| `ILIKE` | `dialect::ilike("col", n)` |
| `NOW()`, `INTERVAL '7 days'` | bind `chrono::Utc::now()`, or `dialect::now()` / `dialect::interval_before()` |
| `string_agg(...)` | `dialect::string_agg(...)` |
| `SELECT pg_notify(...)` | `kubuno_db::events::notify(...)` |
| `DISTINCT ON`, `array_agg`, `SKIP LOCKED` | no portable form — restructure (see §5) |

Two constructs are **refused outright**, on every backend including PostgreSQL:

* a placeholder out of order or reused (`... $2 ... $1 ...`, or `$1` twice) —
  `?` is positional and cannot express it. Bind the value a second time.
* a bare `?` — it would be mistaken for a placeholder and shift every parameter
  after it by one.

Failing loudly is deliberate. A query that is silently one bind off is the kind
of defect only production finds.

### 2.8 Array columns become JSON

PostgreSQL's `TEXT[]` and `UUID[]` have no equivalent on MySQL or SQLite. The
portable representation of a small list column is a **JSON array**, and the
foundation makes writing, reading and filtering one ergonomic on all three
engines. (A list that needs atomicity or an inverted index becomes a child
table instead — out of scope here.)

**Write** — bind the vector; it becomes a JSON array through `DbValue::Json`:

```rust
let tags: Vec<String> = vec!["red".into(), "green".into()];
db.execute("INSERT INTO photos.items (id, tags) VALUES ($1, $2)",
           params![id, tags]).await?;         // Vec<String>, &[String], Vec<Uuid>, … all work
```

`From` impls cover `Vec<String>`/`Vec<Uuid>` (owned, `&[..]`, `&Vec<..>`, and
`Option<Vec<..>>` for a nullable column). `Vec<Uuid>` is written as an array of
hyphenated strings, the spelling `uuid`'s own `Serialize` uses.

**Read** — two paths, both portable across the three drivers:

```rust
// (a) the sqlx-native derive attribute — the common case:
#[derive(sqlx::FromRow)]
struct Item { id: Uuid, #[sqlx(json)] tags: Vec<String> }

// (b) the JsonVec<T> wrapper — needed on the hand-mapped DbRow::try_get path,
//     where a plain Vec<String> would mean PostgreSQL's TEXT[], not a JSON array:
#[derive(sqlx::FromRow)]
struct Item2 { id: Uuid, tags: JsonVec<String> }   // Derefs to Vec<String>
let tags: JsonVec<String> = row.try_get("tags")?;
```

**Filter** — `Backend::json_array_contains(col, n)` replaces `value = ANY(col)`
and its GIN index. The candidate is a bound value, never interpolated (for a
UUID, bind `uuid.to_string()`):

```rust
let frag = db.backend().json_array_contains("tags", 1);   // $1 is the candidate
let rows: Vec<Item> =
    db.fetch_all_as(&format!("SELECT * FROM photos.items WHERE {frag}"),
                    params!["green"]).await?;
```

It emits `col @> jsonb_build_array($n)` on PostgreSQL (a `jsonb` GIN index
serves it), `JSON_CONTAINS(col, JSON_QUOTE($n))` on MySQL, and
`EXISTS (SELECT 1 FROM json_each(col) WHERE value = $n)` on SQLite.

**Migrating an existing `TEXT[]`/`UUID[]` column (octet-safe).** The PostgreSQL
migration that first created the column is *frozen* — its bytes and checksum
must not change (§2.6), and its tables are named without a schema prefix,
trusting the search path the pool sets. So the conversion is a **new** migration
file appended to `migrations/postgres/`, spelled the same unqualified way:

```sql
-- migrations/postgres/000042_tags_to_jsonb.up.sql
-- TEXT[]  → jsonb array of strings.  (For a UUID[] column, to_jsonb() yields an
-- array of the UUIDs' text form, exactly what JsonVec<Uuid> reads back.)
ALTER TABLE items ALTER COLUMN tags TYPE jsonb USING to_jsonb(tags);

-- Swap the array GIN index for a jsonb one so `@>` (json_array_contains) is indexed.
DROP INDEX IF EXISTS idx_items_tags;                 -- was: USING gin (tags)  [array_ops]
CREATE INDEX idx_items_tags ON items USING gin (tags jsonb_path_ops);
```

`jsonb_path_ops` is the smaller, faster GIN opclass for `@>`-only lookups; use
the default `jsonb_ops` if you also need key-existence operators. The
**MySQL and SQLite** migration directories are new, so their `CREATE TABLE`
declares the column JSON from the start — `tags JSON NOT NULL` (MySQL) /
`tags TEXT NOT NULL` (SQLite), or `Backend::col_json()` in a generated migration
— and never carry an `ALTER`.

---

## 3. `RETURNING`, and the prerequisite behind it

487 statements use `RETURNING`, in all 22 modules. PostgreSQL and SQLite have
it; MySQL and MariaDB effectively do not.

**The blocker is not the clause, it is the key.** 295 Kubuno tables declare
`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, so the key is invented by the
database and `RETURNING` is the only way the process learns it. On MySQL there
is no other way — `LAST_INSERT_ID()` reports an `AUTO_INCREMENT` integer, which
a UUID column is not.

So each such insert must **generate the key in Rust** and bind it:

```rust
let id = kubuno_db::new_id();
// INSERT INTO office.documents (id, owner_id, title) VALUES ($1, $2, $3)
```

The PostgreSQL `DEFAULT` stays in the (frozen) migration and is simply
overridden. The MySQL and SQLite migrations declare the column without one.

Once the key is known before the write, the helpers make the call site identical
on the three engines:

```rust
let mut tx = pool.begin().await?;
let row = kubuno_db::returning::insert_returning_row(
    &mut tx,
    "INSERT INTO office.documents (id, owner_id, title) VALUES ($1, $2, $3)",
    "*",                                   // what RETURNING would have listed
    |q| q.bind(id).bind(owner).bind(&title),
    "SELECT * FROM office.documents WHERE id = $1",   // MySQL only
    |q| q.bind(id),
).await?;
tx.commit().await?;
```

On PostgreSQL and SQLite: one statement, `RETURNING` appended. On MySQL: the
write, then the re-select — **always inside a transaction**, or a concurrent
session slips between them.

`update_returning_row` and `delete_returning_row` follow the same shape;
`delete` necessarily reads *before* it writes.

### What this cannot do

* **A guarded update.** `UPDATE … WHERE status = 'draft' … RETURNING *` cannot
  be emulated: once the update has changed `status`, a re-select keyed on the
  guard finds nothing, and one keyed on the primary key returns the row even
  when the guard never matched. Restructure it as `SELECT … FOR UPDATE` inside
  a transaction, then decide in Rust. That pattern is portable *and* says what
  it means.
* **`RETURNING` on a multi-row write.** The helpers handle one row.
* **A `DEFAULT` the database computes and the caller needs back**, other than
  through the re-select, which does return it.

---

## 4. Aggregate return types

`sqlx` type-checks on decode, and an aggregate does not return the same SQL type
on the three engines:

| expression | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| `COUNT(*)` | `bigint` | `BIGINT UNSIGNED` | `INTEGER` |
| `SUM(bigint)` | `numeric` | `DECIMAL` | `INTEGER` |
| `AVG(int)` | `numeric` | `DOUBLE` | `REAL` |

`numeric` and `DECIMAL` do **not** decode into `i64`/`f64` without the
`bigdecimal`/`rust_decimal` features. `dialect::sum_bigint`, `count_bigint` and
`avg_double` wrap the right cast for the engine, and `sum_bigint` also coalesces
`NULL` to `0`.

---

## 5. What this crate will never cover

* **The event bus.** `LISTEN`/`NOTIFY` has no equivalent. `events::notify`
  writes to a `<schema>.kubuno_event_outbox` table instead — durably, in the
  same transaction as the data, which is better than `pg_notify`. **But the
  core has no poller for it yet.** On MySQL and SQLite, events are recorded and
  undelivered. This is the largest remaining piece of core work.
* **The job queue.** `SELECT ... FOR UPDATE SKIP LOCKED` exists on MySQL 8 and
  MariaDB 10.6, and not at all on SQLite. A portable queue needs a different
  strategy per engine.
* **The `.sqlx` caches.** `core` (129 entries), `media` (173) and `drive` (8)
  use `sqlx::query!` macros, verified at compile time against a live
  PostgreSQL. Those are not portable as they stand: either the macros become
  runtime `kubuno_db::query`, or a cache is prepared per engine. Nothing here
  changes that.
* **Full-text search.** `tsvector`/`pg_trgm` against `MATCH ... AGAINST` against
  FTS5: three different engines with three different query languages.
* **PostgreSQL-specific types**: the native array type (`TEXT[]`, `UUID[]`),
  `INET`, `CITEXT`, ranges, `INTERVAL` as a column type. A *small list* column is
  the exception — it is carried portably as a JSON array (§2.8); it is only the
  native array **type**, with its operators and GIN opclasses, that has no
  cross-engine form.
* **Concurrency semantics.** `SERIALIZABLE` does not mean the same thing in the
  three engines, and MySQL reports 0 affected rows for an `UPDATE` that changed
  nothing. A module that reasons on `rows_affected` must be re-read.

---

## 6. Testing

All three drivers are always compiled in (there are no per-engine features), so
one command builds and tests everything. SQLite round-trips run unconditionally
on a temp file; the MySQL/MariaDB round-trips run only when a throwaway server
URL is provided, and **fail** rather than skip if that URL is set but unreachable
— a test that quietly does nothing is worse than no test.

```sh
# SQLite round-trips run with no setup:
SQLX_OFFLINE=true cargo test -p kubuno-db

# add the MySQL/MariaDB round-trips by pointing at a throwaway server
# (a disposable datadir, a non-standard port, never a shared database):
KUBUNO_QB_MYSQL_URL=mysql://root@127.0.0.1:3399/throwaway \
  SQLX_OFFLINE=true cargo test -p kubuno-db
```

CI runs `cargo clippy -p kubuno-db --all-targets -- -D warnings` with all three
drivers linked; keep it green.

---

## 7. Security

`sqlx` 0.9 refuses non-literal query text unless it is wrapped in
`AssertSqlSafe`. This crate contains exactly **one** such wrap,
`sql::assert_safe`, applied to the output of `sql::prepare` — developer-written
SQL with at most its placeholder syntax changed. `prepare` only ever *removes*
characters and copies the rest verbatim, so it cannot introduce a construct the
source did not already have.

Dynamic fragments come from `dialect`, whose identifier parameters are all
`&'static str`: a value that cannot come from an HTTP request without a
deliberate leak. **Bind parameters remain the only channel for user data.**
