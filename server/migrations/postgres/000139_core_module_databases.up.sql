-- Per-module database override.
--
-- By default every module inherits the core's own database engine and
-- credentials (see `spawn_module`, which injects `KUBUNO_DB_*` derived from the
-- core config). This table lets an administrator point ONE module at a
-- different engine or server: the presence of an enabled row overrides the
-- inherited credentials for that module, its absence means "inherit".
--
-- The password is stored as an AES-GCM blob (the same scheme as OIDC secrets and
-- SMTP passwords), sealed with a key derived from the data-encryption root.
CREATE TABLE core.module_databases (
    module_id     VARCHAR(100) PRIMARY KEY REFERENCES core.modules(id) ON DELETE CASCADE,
    engine        VARCHAR(20)  NOT NULL DEFAULT 'postgres',   -- postgres | mysql | sqlite
    host          VARCHAR(255) NOT NULL DEFAULT '',
    port          INTEGER      NOT NULL DEFAULT 0,            -- 0 = the engine default
    db_user       VARCHAR(255) NOT NULL DEFAULT '',
    password_enc  TEXT         NOT NULL DEFAULT '',           -- AES-GCM blob; '' = no password
    db_name       VARCHAR(255) NOT NULL DEFAULT '',           -- PostgreSQL physical database
    db_path       VARCHAR(1000) NOT NULL DEFAULT '',          -- SQLite directory
    schema_prefix VARCHAR(32),                                -- optional namespace prefix
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,         -- FALSE = keep the row but inherit
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER module_databases_updated_at BEFORE UPDATE ON core.module_databases
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();
