DROP INDEX IF EXISTS core.idx_core_settings_module;

ALTER TABLE core.settings
    DROP COLUMN IF EXISTS scope,
    DROP COLUMN IF EXISTS value_type,
    DROP COLUMN IF EXISTS allowed_values,
    DROP COLUMN IF EXISTS module_id,
    DROP COLUMN IF EXISTS default_value;
