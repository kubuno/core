-- Engine-switch jobs: the persisted progress of copying a scope's data from one
-- database engine to another (see handlers/admin/db_switch.rs). One row per
-- migration, updated as the copy advances so a page refresh shows where it is.
--
-- `scope` is 'core' for the main database or a module id for a per-module switch.
CREATE TABLE core.db_migration_jobs (
    id             UUID         PRIMARY KEY,
    scope          VARCHAR(100) NOT NULL,                 -- 'core' | module id
    source_engine  VARCHAR(20)  NOT NULL,
    target_engine  VARCHAR(20)  NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'pending', -- pending|running|succeeded|failed
    tables_total   INTEGER      NOT NULL DEFAULT 0,
    tables_done    INTEGER      NOT NULL DEFAULT 0,
    total_rows     BIGINT       NOT NULL DEFAULT 0,
    copied_rows    BIGINT       NOT NULL DEFAULT 0,
    current_table  VARCHAR(255) NOT NULL DEFAULT '',
    error          TEXT         NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX db_migration_jobs_scope_idx ON core.db_migration_jobs (scope, created_at DESC);

CREATE TRIGGER db_migration_jobs_updated_at BEFORE UPDATE ON core.db_migration_jobs
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();
