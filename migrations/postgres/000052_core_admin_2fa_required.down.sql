ALTER TABLE core.users DROP COLUMN IF EXISTS admin_2fa_grace_until;
DELETE FROM core.settings
 WHERE key IN ('security.admin_2fa_required', 'security.admin_2fa_grace_days');
