ALTER TABLE core.users
  ADD COLUMN IF NOT EXISTS totp_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS totp_secret         TEXT,
  ADD COLUMN IF NOT EXISTS totp_pending_secret TEXT;
