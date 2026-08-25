-- Restores the columns, empty. The material they used to hold is on disk now and
-- is deliberately NOT copied back: a downgrade must not put private keys into
-- the database again.
ALTER TABLE core.tls_certificates
    ADD COLUMN IF NOT EXISTS cert_pem      TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS key_encrypted TEXT NOT NULL DEFAULT '';

ALTER TABLE core.acme_state
    ADD COLUMN IF NOT EXISTS account_credentials_encrypted TEXT;
