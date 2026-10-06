-- Active maintenance notices: one row per in-flight database maintenance
-- operation (engine switch, schema-prefix change, backup restore, module
-- database change/sync/migration). A row exists ONLY while the operation runs:
-- a RAII guard inserts it before the work and deletes it in every branch
-- (success, failure, panic), and the core sweeps any row left behind by a
-- crashed or restarted process at startup. Every connected client shows a
-- banner for as long as a matching row is present.
--
-- `scope` is 'global' (the whole instance) or a module id (that module only).
-- `message` is a short, human-readable line, already free of any secret.
CREATE TABLE core.maintenance_notices (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope      VARCHAR(100) NOT NULL,
    message    TEXT         NOT NULL,
    kind       VARCHAR(50)  NOT NULL DEFAULT 'maintenance',
    started_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_core_maintenance_notices_started ON core.maintenance_notices (started_at DESC);
