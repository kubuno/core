-- `core.setting_values.key` references `core.settings(key) ON DELETE CASCADE`
-- (migration 000060), so removing the declarations takes every per-scope value
-- and every lock with them.
DELETE FROM core.settings
 WHERE key IN (
     'security.password_min_length',
     'security.password_strong',
     'security.password_reuse_allowed',
     'security.password_history_depth',
     'security.password_expiry_days',
     'security.password_enforce_at_login',
     'auth.self_service_recovery'
 );

DROP INDEX IF EXISTS core.password_history_user_recent_idx;
DROP TABLE IF EXISTS core.password_history;

ALTER TABLE core.users DROP COLUMN IF EXISTS password_changed_at;
