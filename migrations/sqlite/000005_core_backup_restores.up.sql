-- Hot-restore history: one row per restore performed from the admin console.
-- See the PostgreSQL migration of the same name for the rationale. `safety_file`
-- is the automatic backup taken just before the restore; both file columns hold
-- base names inside the backup destination, never paths or credentials.
CREATE TABLE "core"."backup_restores" (
    "id"            BLOB    NOT NULL,
    "triggered_by"  BLOB,
    "actor_label"   TEXT,
    "status"        TEXT    NOT NULL DEFAULT 'running',
    "source_file"   TEXT    NOT NULL,
    "safety_file"   TEXT,
    "format"        TEXT,
    "started_at"    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "finished_at"   TEXT,
    "duration_ms"   INTEGER,
    "schemas_count" INTEGER,
    "rows_count"    INTEGER,
    "error"         TEXT,
    CHECK ("status" IN ('running', 'success', 'failed')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("triggered_by") REFERENCES "users" ("id") ON DELETE SET NULL
);

CREATE INDEX "core"."idx_core_backup_restores_started" ON "backup_restores" ("started_at");
