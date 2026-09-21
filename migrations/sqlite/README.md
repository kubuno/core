# SQLite migrations for the core schema

This directory holds the SQLite form of the `core` schema, consumed by
`kubuno_db::migrations!` when the administrator selects the MySQL engine.

Status: **not yet authored.** The PostgreSQL migrations under `../postgres`
(137 numbered steps) are the source of truth and must be consolidated into an
equivalent MySQL shape (no extensions, no PL/pgSQL triggers/functions,
``BLOB` UUIDs, TEXT timestamps, JSON columns for the former
`UUID[]`/`jsonb` array columns, and a `kubuno_event_outbox` table — see
`kubuno_db::events::ensure_outbox`). Consolidate into a small number of
`CREATE TABLE` migrations rather than replaying the 137 incremental PG steps.
