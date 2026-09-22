-- Engine-switch jobs (SQLite form). Additive, schema-qualified so a prefixed
-- instance's DDL lands in its own attached database. See ../postgres/000140.
CREATE TABLE "core"."db_migration_jobs" (
    "id"             BLOB    NOT NULL,
    "scope"          TEXT    NOT NULL,
    "source_engine"  TEXT    NOT NULL,
    "target_engine"  TEXT    NOT NULL,
    "status"         TEXT    NOT NULL DEFAULT 'pending',
    "tables_total"   INTEGER NOT NULL DEFAULT 0,
    "tables_done"    INTEGER NOT NULL DEFAULT 0,
    "total_rows"     INTEGER NOT NULL DEFAULT 0,
    "copied_rows"    INTEGER NOT NULL DEFAULT 0,
    "current_table"  TEXT    NOT NULL DEFAULT '',
    "error"          TEXT    NOT NULL DEFAULT '',
    "created_at"     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at"     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("id")
);
CREATE INDEX "core"."db_migration_jobs_scope_idx" ON "db_migration_jobs" ("scope", "created_at");
