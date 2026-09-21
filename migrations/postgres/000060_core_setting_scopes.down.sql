-- Rolling back leaves `core.settings.value` holding the instance-scope value,
-- which is exactly what the pre-000060 code reads. Overrides below the instance
-- level are dropped with the table — they have no representation in the old
-- model.
DROP TRIGGER IF EXISTS settings_value_redirect        ON core.settings;
DROP TRIGGER IF EXISTS setting_values_mirror_instance     ON core.setting_values;
DROP TRIGGER IF EXISTS setting_values_mirror_instance_del ON core.setting_values;
DROP TRIGGER IF EXISTS org_units_purge_setting_values  ON core.org_units;
DROP TRIGGER IF EXISTS user_groups_purge_setting_values ON core.user_groups;
DROP TRIGGER IF EXISTS users_purge_setting_values      ON core.users;

DROP FUNCTION IF EXISTS core.settings_value_redirect();
DROP FUNCTION IF EXISTS core.setting_values_mirror();
DROP FUNCTION IF EXISTS core.setting_values_purge_scope();
DROP FUNCTION IF EXISTS core.setting_overrides(TEXT);
DROP FUNCTION IF EXISTS core.setting_chain(TEXT, TEXT, UUID);

DROP TABLE IF EXISTS core.setting_values;

COMMENT ON COLUMN core.settings.value IS NULL;
