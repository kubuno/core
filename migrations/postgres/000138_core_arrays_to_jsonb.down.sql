-- Reverse the JSONB list columns back to PostgreSQL `TEXT[]`.
-- `jsonb_array_elements_text` unrolls the JSON array into rows that `ARRAY(...)`
-- gathers back into a text array.

DROP INDEX IF EXISTS core.idx_core_api_tokens_scopes;
ALTER TABLE core.api_tokens DROP CONSTRAINT IF EXISTS api_tokens_scoped_or_legacy;

ALTER TABLE core.api_tokens
    ALTER COLUMN scopes DROP DEFAULT,
    ALTER COLUMN scopes TYPE TEXT[] USING ARRAY(SELECT jsonb_array_elements_text(scopes)),
    ALTER COLUMN scopes SET DEFAULT '{}';

ALTER TABLE core.api_tokens
    ADD CONSTRAINT api_tokens_scoped_or_legacy
    CHECK (is_legacy OR cardinality(scopes) > 0);

CREATE INDEX idx_core_api_tokens_scopes ON core.api_tokens USING GIN (scopes);

ALTER TABLE core.tls_certificates
    ALTER COLUMN san DROP DEFAULT,
    ALTER COLUMN san TYPE TEXT[] USING ARRAY(SELECT jsonb_array_elements_text(san)),
    ALTER COLUMN san SET DEFAULT '{}';

ALTER TABLE core.modules
    ALTER COLUMN dependencies DROP DEFAULT,
    ALTER COLUMN dependencies TYPE TEXT[] USING ARRAY(SELECT jsonb_array_elements_text(dependencies)),
    ALTER COLUMN dependencies SET DEFAULT '{}';

ALTER TABLE core.module_instances
    ALTER COLUMN subscribed_events DROP DEFAULT,
    ALTER COLUMN subscribed_events TYPE TEXT[] USING ARRAY(SELECT jsonb_array_elements_text(subscribed_events)),
    ALTER COLUMN subscribed_events SET DEFAULT '{}';

ALTER TABLE core.migration_campaigns
    ALTER COLUMN exclude_folders DROP DEFAULT,
    ALTER COLUMN exclude_folders TYPE TEXT[] USING ARRAY(SELECT jsonb_array_elements_text(exclude_folders)),
    ALTER COLUMN exclude_folders SET DEFAULT '{}';

ALTER TABLE core.data_export_runs
    ALTER COLUMN services DROP DEFAULT,
    ALTER COLUMN services TYPE TEXT[] USING ARRAY(SELECT jsonb_array_elements_text(services)),
    ALTER COLUMN services SET DEFAULT '{}';

ALTER TABLE core.data_export_subjects
    ALTER COLUMN services_ok DROP DEFAULT,
    ALTER COLUMN services_ok TYPE TEXT[] USING ARRAY(SELECT jsonb_array_elements_text(services_ok)),
    ALTER COLUMN services_ok SET DEFAULT '{}',
    ALTER COLUMN services_ko DROP DEFAULT,
    ALTER COLUMN services_ko TYPE TEXT[] USING ARRAY(SELECT jsonb_array_elements_text(services_ko)),
    ALTER COLUMN services_ko SET DEFAULT '{}';
