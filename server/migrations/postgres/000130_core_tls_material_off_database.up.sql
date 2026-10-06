-- Moves the TLS private key and the ACME account key OUT of the database.
--
-- ## Why
--
-- 000125 and 000127 stored both as AES-256-GCM blobs. Encrypted at rest is
-- better than plain, but it still put the instance's identity inside a table:
-- something an administrative API can read, a `pg_dump` copies wholesale, a
-- replica ships elsewhere, and any SQL flaw anywhere in the product can reach.
-- A TLS private key lets its holder BE this instance and decrypt traffic
-- recorded earlier; the ACME account key lets them mint fresh certificates for
-- its domains. Neither is application data.
--
-- Every web server keeps this material in files owned by the service and
-- readable by nobody else — Apache's `SSLCertificateKeyFile`, nginx's
-- `ssl_certificate_key`, certbot's `/etc/letsencrypt/live/…`. The core now does
-- the same: `/var/lib/kubuno/tls/{cert.pem,key.pem,acme-account.json}`, mode
-- 0600 in a 0700 directory (see `crate::network::store`), with the paths
-- overridable through `[server.tls] cert_path` / `key_path` in config.toml.
--
-- Dropping the columns is the point of the migration, not a side effect: as long
-- as they exist, something can write a secret back into them.
--
-- ## What survives here
--
-- The metadata the console displays — subject, issuer, SAN, validity, source,
-- which one is active — none of which is secret. An instance that already held a
-- certificate must re-import it (or let ACME re-issue): the material cannot be
-- moved to a file by an SQL migration, and a row pointing at a key that no
-- longer exists would be worse than an empty list.

ALTER TABLE core.tls_certificates
    DROP COLUMN IF EXISTS cert_pem,
    DROP COLUMN IF EXISTS key_encrypted;

COMMENT ON TABLE core.tls_certificates IS
    'Metadata of the TLS certificates this instance has served. The key material lives on disk (see crate::network::store) and is deliberately absent from this table.';

ALTER TABLE core.acme_state
    DROP COLUMN IF EXISTS account_credentials_encrypted;

COMMENT ON TABLE core.acme_state IS
    'Singleton: which ACME directory and contact the account was created against, and the outcome of the last order. The account key lives on disk, never here.';

-- Rows whose material lived only in the dropped columns now describe a
-- certificate the server cannot serve. Clearing them keeps the console honest:
-- "no certificate installed" is true, and the operator re-imports one.
DELETE FROM core.tls_certificates;
