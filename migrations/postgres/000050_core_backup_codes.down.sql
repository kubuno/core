DROP INDEX IF EXISTS core.idx_core_tbc_user;
DROP INDEX IF EXISTS core.idx_core_tbc_user_unused;
DROP TABLE IF EXISTS core.totp_backup_codes;
DELETE FROM core.settings WHERE key = 'security.backup_codes_low_threshold';
