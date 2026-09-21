# MySQL / MariaDB migrations for the core schema

This directory holds the MySQL/MariaDB form of the `core` schema, consumed by
`kubuno_db::migrations!` when the administrator selects the MySQL engine.

`000001_core_schema` is the **consolidated final shape** the 138 PostgreSQL
migrations under `../postgres` reach — one `CREATE TABLE` per table (78 tables),
not a replay of the incremental steps. The `core` database is created by
kubuno-db before the migrator runs, so identifiers are unqualified and
back-ticked. Foreign-key checks are turned off while the tables are created
because they reference one another out of dependency order.

Type/behaviour mapping: `UUID`/`citext` → `BINARY(16)`/`VARCHAR`; `TIMESTAMPTZ`
→ `DATETIME(6)` (UTC); `JSONB`/`JSON` and the former `TEXT[]` list columns →
`JSON`; `BIGSERIAL` → `AUTO_INCREMENT`. The plpgsql triggers (updated_at,
audit hash chain, audience pruning, setting mirrors, org-unit placement, jobs
NOTIFY) are enforced in Rust — only `updated_at` keeps a DB default via
`ON UPDATE CURRENT_TIMESTAMP(6)`. Conditional/partial and expression UNIQUE
indexes are enforced in Rust; plain partial indexes are flattened to full ones.
tsvector/GIN search becomes per-engine `ILIKE` (`Backend::ilike`).
