DROP INDEX IF EXISTS core.idx_core_users_ou;
ALTER TABLE core.users DROP COLUMN IF EXISTS org_unit_id;
DROP TABLE IF EXISTS core.org_units;
