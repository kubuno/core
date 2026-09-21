-- Convert the shared list columns from PostgreSQL `TEXT[]` to `JSONB`.
--
-- The runtime-engine foundation stores a small list column the same way on all
-- three engines: a JSON array, bound and read through `#[sqlx(json)] Vec<T>`.
-- MySQL and SQLite have no array type, so JSON is the portable representation;
-- on PostgreSQL these columns were `TEXT[]`, which the JSON code path cannot
-- read or write. `to_jsonb(text[])` yields a JSON array of strings, identical
-- to what the application binds, so no data is lost.

-- api_tokens.scopes carries a GIN index used for membership; it must be dropped
-- before the type change and recreated for the new type.
DROP INDEX IF EXISTS core.idx_core_api_tokens_scopes;

ALTER TABLE core.api_tokens
    ALTER COLUMN scopes DROP DEFAULT,
    ALTER COLUMN scopes TYPE JSONB USING to_jsonb(scopes),
    ALTER COLUMN scopes SET DEFAULT '[]'::jsonb;

-- `jsonb_path_ops` supports the containment test (`@>`) that
-- `Backend::json_array_contains` emits on PostgreSQL.
CREATE INDEX idx_core_api_tokens_scopes ON core.api_tokens USING GIN (scopes jsonb_path_ops);

ALTER TABLE core.tls_certificates
    ALTER COLUMN san DROP DEFAULT,
    ALTER COLUMN san TYPE JSONB USING to_jsonb(san),
    ALTER COLUMN san SET DEFAULT '[]'::jsonb;

ALTER TABLE core.modules
    ALTER COLUMN dependencies DROP DEFAULT,
    ALTER COLUMN dependencies TYPE JSONB USING to_jsonb(dependencies),
    ALTER COLUMN dependencies SET DEFAULT '[]'::jsonb;

ALTER TABLE core.module_instances
    ALTER COLUMN subscribed_events DROP DEFAULT,
    ALTER COLUMN subscribed_events TYPE JSONB USING to_jsonb(subscribed_events),
    ALTER COLUMN subscribed_events SET DEFAULT '[]'::jsonb;

ALTER TABLE core.migration_campaigns
    ALTER COLUMN exclude_folders DROP DEFAULT,
    ALTER COLUMN exclude_folders TYPE JSONB USING to_jsonb(exclude_folders),
    ALTER COLUMN exclude_folders SET DEFAULT '[]'::jsonb;

ALTER TABLE core.data_export_runs
    ALTER COLUMN services DROP DEFAULT,
    ALTER COLUMN services TYPE JSONB USING to_jsonb(services),
    ALTER COLUMN services SET DEFAULT '[]'::jsonb;

ALTER TABLE core.data_export_subjects
    ALTER COLUMN services_ok DROP DEFAULT,
    ALTER COLUMN services_ok TYPE JSONB USING to_jsonb(services_ok),
    ALTER COLUMN services_ok SET DEFAULT '[]'::jsonb,
    ALTER COLUMN services_ko DROP DEFAULT,
    ALTER COLUMN services_ko TYPE JSONB USING to_jsonb(services_ko),
    ALTER COLUMN services_ko SET DEFAULT '[]'::jsonb;
