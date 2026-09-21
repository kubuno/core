# SQLite migrations for the core schema

This directory holds the SQLite form of the `core` schema, consumed by
`kubuno_db::migrations!` when the administrator selects the SQLite engine.

`000001_core_schema` is the **consolidated final shape** the 138 PostgreSQL
migrations under `../postgres` reach — one `CREATE TABLE` per table (78 tables),
not a replay of the incremental steps. `core` is an ATTACHed database file, so
tables and indexes are qualified `core.`, foreign-key REFERENCES are unqualified
(same database), and kubuno-db enables `PRAGMA foreign_keys`.

Type/behaviour mapping: `UUID` → `BLOB`; `TIMESTAMPTZ` → `TEXT` (UTC); `JSONB`/
`JSON` and the former `TEXT[]` list columns → `TEXT` holding JSON; `BOOLEAN` →
`INTEGER`; `BIGSERIAL` → `INTEGER PRIMARY KEY AUTOINCREMENT`. The plpgsql
triggers and the conditional UNIQUE indexes are enforced in Rust (updated_at
too); plain partial indexes are flattened. tsvector/GIN search becomes
per-engine `ILIKE` (`Backend::ilike`).
