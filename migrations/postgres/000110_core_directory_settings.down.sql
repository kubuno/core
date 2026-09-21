-- `core.setting_values.key` references `core.settings(key) ON DELETE CASCADE`
-- (migration 000060), so removing the declarations takes every per-scope value
-- and every lock with them. That is the intent: the keys no longer exist, and a
-- value for an undeclared key would be unreadable and unreachable.
DELETE FROM core.settings
 WHERE key IN (
     'directory.enabled',
     'directory.share_email',
     'directory.audience',
     'directory.profile_edit_name',
     'directory.profile_edit_photo'
 );
