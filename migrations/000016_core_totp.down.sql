ALTER TABLE core.users
  DROP COLUMN IF EXISTS totp_enabled,
  DROP COLUMN IF EXISTS totp_secret,
  DROP COLUMN IF EXISTS totp_pending_secret;
