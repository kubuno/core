-- Dropping the declaration takes its per-scope values with it
-- (core.setting_values.key references core.settings.key ON DELETE CASCADE).
DELETE FROM core.settings WHERE key IN ('instance.locale', 'instance.timezone');
