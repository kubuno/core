-- Hot-restore history: one row per restore performed from the admin console.
--
-- A restore replaces the data of every Kubuno schema, so it is at least as
-- consequential as a backup and deserves its own record. The row is opened
-- BEFORE the work starts (like `core.backup_runs`): a process killed mid-restore
-- leaves a visibly stuck `running` row rather than no trace at all.
--
-- `safety_file` is the automatic backup taken just before the restore, so the
-- operator can always roll back to the state that preceded it. `source_file` is
-- the archive that was restored. Both are base names inside the backup
-- destination — never absolute paths, never anything derived from a credential.
CREATE TABLE core.backup_restores (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    triggered_by  UUID         REFERENCES core.users(id) ON DELETE SET NULL,
    actor_label   VARCHAR(255),
    status        VARCHAR(20)  NOT NULL DEFAULT 'running'
                                   CHECK (status IN ('running', 'success', 'failed')),
    source_file   VARCHAR(255) NOT NULL,
    safety_file   VARCHAR(255),
    format        VARCHAR(20),
    started_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    finished_at   TIMESTAMPTZ,
    duration_ms   BIGINT       CHECK (duration_ms IS NULL OR duration_ms >= 0),
    schemas_count INTEGER      CHECK (schemas_count IS NULL OR schemas_count >= 0),
    rows_count    BIGINT       CHECK (rows_count IS NULL OR rows_count >= 0),
    error         TEXT
);

CREATE INDEX idx_core_backup_restores_started ON core.backup_restores (started_at DESC);
