DELETE FROM core.settings WHERE key = 'users.purge_after_days';
DROP INDEX IF EXISTS core.idx_core_users_deleted_at;
ALTER TABLE core.users DROP COLUMN IF EXISTS deleted_at;
