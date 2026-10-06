-- Registry of known database connections per scope.
--
-- Switching a scope's engine (see handlers/admin/db_switch.rs) used to leave the
-- previous database unreachable from the console once the pointer moved. This
-- table keeps every connection a scope has ever pointed at — the source before a
-- switch and the target after it — so an administrator can always go back to an
-- earlier database: re-point at it and reuse its data as-is, overwrite it with a
-- fresh copy of the current data, or refresh a standby without switching.
--
-- `scope` is 'core' for the main database or a module id. `is_current` marks the
-- one connection the scope runs on right now (at most one per scope, enforced in
-- Rust). The password is stored as an AES-GCM blob under a dedicated key domain
-- (`b"kubuno:db-connection:"`), the same scheme as core.module_databases, and is
-- never returned in a response or written to a log.
CREATE TABLE core.db_connections (
    id             UUID          PRIMARY KEY,
    scope          VARCHAR(100)  NOT NULL,                  -- 'core' | module id
    engine         VARCHAR(20)   NOT NULL,                  -- postgres | mysql | sqlite
    host           VARCHAR(255)  NOT NULL DEFAULT '',
    port           INTEGER       NOT NULL DEFAULT 0,        -- 0 = the engine default
    db_user        VARCHAR(255)  NOT NULL DEFAULT '',
    password_enc   TEXT          NOT NULL DEFAULT '',       -- AES-GCM blob; '' = no password
    db_name        VARCHAR(255)  NOT NULL DEFAULT '',       -- PostgreSQL/MySQL database
    db_path        VARCHAR(1000) NOT NULL DEFAULT '',       -- SQLite directory
    schema_prefix  VARCHAR(32),                             -- optional namespace prefix
    label          VARCHAR(255),                            -- optional; derived if absent
    is_current     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_used_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    -- One row per distinct target within a scope, so auto-registration on a
    -- switch never piles up duplicates (it updates the existing row instead).
    CONSTRAINT db_connections_identity_uk
        UNIQUE (scope, engine, host, port, db_name, db_path)
);

CREATE INDEX db_connections_scope_idx ON core.db_connections (scope, created_at DESC);
