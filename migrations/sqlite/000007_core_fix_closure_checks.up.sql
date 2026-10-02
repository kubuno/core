-- no-transaction
-- Fixes two CHECK constraints the consolidated `000001_core_schema` mistranslated
-- from PostgreSQL (SQLite form; see ../mysql/000007 for the MySQL/MariaDB one).
-- `000001` stays byte-identical so an instance that applied it keeps its checksum.
--
-- PostgreSQL ties a status to a timestamp:
--   alerts            (status IN ('resolved','ignored')) = (closed_at IS NOT NULL)
--                     (assignee_id IS NULL) = (assigned_at IS NULL)
--   data_export_runs  pending/running <=> finished_at IS NULL, expires_at > available_at
-- `000001` reduced each closure constraint to its first `IN` list — a plain
-- CHECK (status IN ('resolved', 'ignored')) / CHECK (status IN ('pending',
-- 'running')) — so no alert could be raised as 'new', no export could become
-- 'ready', and an engine switch onto SQLite failed as soon as the source held one.
--
-- SQLite cannot drop a constraint, so both tables are rebuilt the way SQLite
-- documents it (ALTER TABLE, "Making Other Kinds Of Table Schema Changes"):
-- foreign keys off — outside any transaction, hence `no-transaction` — so that
-- dropping the old table neither cascades to the children (alert_events,
-- data_export_subjects); the new table is built beside the old one, the old one
-- dropped, the new one renamed into its place (the children's REFERENCES name
-- it, unchanged);
-- then the rebuild in one explicit transaction, checked by foreign_key_check.
-- Rows are carried over made coherent with the real constraints.

PRAGMA foreign_keys = OFF;
BEGIN;

-- ── alerts ───────────────────────────────────────────────────────────────────
CREATE TABLE "core"."alerts_new" (
    "id" BLOB NOT NULL,
    "source" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "module_id" TEXT,
    "subject_user_id" BLOB,
    "org_unit_id" BLOB,
    "dedup_key" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "first_seen_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_seen_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "assignee_id" BLOB,
    "assigned_at" TEXT,
    "closed_at" TEXT,
    "closed_by" BLOB,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "is_simulation" INTEGER NOT NULL DEFAULT 0,
    CHECK ("severity" IN ('critical', 'warning', 'info')),
    CHECK ("status" IN ('new', 'acknowledged', 'resolved', 'ignored')),
    CONSTRAINT "alert_assignment_coherent" CHECK (("assignee_id" IS NULL) = ("assigned_at" IS NULL)),
    CONSTRAINT "alert_closure_coherent" CHECK (("status" IN ('resolved', 'ignored')) = ("closed_at" IS NOT NULL)),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("assignee_id") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("closed_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("org_unit_id") REFERENCES "org_units" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("subject_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
);

INSERT INTO "core"."alerts_new" (
    "id", "source", "kind", "severity", "status", "title", "summary", "payload", "module_id",
    "subject_user_id", "org_unit_id", "dedup_key", "occurrences", "first_seen_at", "last_seen_at",
    "assignee_id", "assigned_at", "closed_at", "closed_by", "created_at", "updated_at", "is_simulation")
SELECT "id", "source", "kind", "severity", "status", "title", "summary", "payload", "module_id",
       "subject_user_id", "org_unit_id", "dedup_key", "occurrences", "first_seen_at", "last_seen_at",
       "assignee_id",
       CASE WHEN "assignee_id" IS NULL THEN NULL ELSE COALESCE("assigned_at", "updated_at") END,
       CASE WHEN "status" IN ('resolved', 'ignored') THEN COALESCE("closed_at", "updated_at") ELSE NULL END,
       "closed_by", "created_at", "updated_at", "is_simulation"
  FROM "core"."alerts";

DROP TABLE "core"."alerts";
ALTER TABLE "core"."alerts_new" RENAME TO "alerts";

CREATE INDEX "core"."idx_core_alerts_assignee" ON "alerts" ("assignee_id");
CREATE INDEX "core"."idx_core_alerts_created" ON "alerts" ("created_at");
CREATE INDEX "core"."idx_core_alerts_kind" ON "alerts" ("kind", "last_seen_at");
CREATE INDEX "core"."idx_core_alerts_open" ON "alerts" ("severity", "last_seen_at");
CREATE INDEX "core"."idx_core_alerts_seen" ON "alerts" ("last_seen_at", "id");
CREATE INDEX "core"."idx_core_alerts_simulation" ON "alerts" ("is_simulation");
CREATE INDEX "core"."idx_core_alerts_subject" ON "alerts" ("subject_user_id");
CREATE TRIGGER "core"."alerts_set_updated_at" AFTER UPDATE ON "alerts"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "alerts" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;

-- ── data_export_runs ─────────────────────────────────────────────────────────
CREATE TABLE "core"."data_export_runs_new" (
    "id" BLOB NOT NULL,
    "scope" TEXT NOT NULL,
    "services" TEXT NOT NULL DEFAULT '[]',
    "with_instance" INTEGER NOT NULL DEFAULT 0,
    "requested_by" BLOB,
    "actor_label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "started_at" TEXT,
    "finished_at" TEXT,
    "duration_ms" INTEGER,
    "available_at" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "subjects_total" INTEGER NOT NULL DEFAULT 0,
    "subjects_done" INTEGER NOT NULL DEFAULT 0,
    "file_name" TEXT,
    "destination" TEXT,
    "size_bytes" INTEGER,
    "entries_count" INTEGER,
    "error" TEXT,
    "file_deleted" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TEXT,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_downloaded_at" TEXT,
    "last_downloaded_by" BLOB,
    "origin" TEXT NOT NULL DEFAULT 'admin',
    "download_limit" INTEGER,
    "max_file_mb" INTEGER,
    CHECK ("origin" IN ('admin', 'self')),
    CHECK ("scope" IN ('instance', 'accounts')),
    CHECK ("status" IN ('pending', 'running', 'ready', 'failed', 'cancelled', 'expired')),
    CONSTRAINT "data_export_closure_coherent" CHECK (
        ("status" IN ('pending', 'running') AND "finished_at" IS NULL)
     OR ("status" NOT IN ('pending', 'running') AND "finished_at" IS NOT NULL)),
    CONSTRAINT "data_export_window_ordered" CHECK ("expires_at" > "available_at"),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("last_downloaded_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("requested_by") REFERENCES "users" ("id") ON DELETE SET NULL
);

INSERT INTO "core"."data_export_runs_new" (
    "id", "scope", "services", "with_instance", "requested_by", "actor_label", "status",
    "requested_at", "started_at", "finished_at", "duration_ms", "available_at", "expires_at",
    "subjects_total", "subjects_done", "file_name", "destination", "size_bytes", "entries_count",
    "error", "file_deleted", "deleted_at", "download_count", "last_downloaded_at",
    "last_downloaded_by", "origin", "download_limit", "max_file_mb")
SELECT "id", "scope", "services", "with_instance", "requested_by", "actor_label", "status",
       "requested_at", "started_at",
       CASE WHEN "status" IN ('pending', 'running') THEN NULL ELSE COALESCE("finished_at", "requested_at") END,
       "duration_ms", "available_at",
       CASE WHEN "expires_at" > "available_at" THEN "expires_at"
            ELSE strftime('%Y-%m-%d %H:%M:%f', "available_at", '+1 second') END,
       "subjects_total", "subjects_done", "file_name", "destination", "size_bytes", "entries_count",
       "error", "file_deleted", "deleted_at", "download_count", "last_downloaded_at",
       "last_downloaded_by", "origin", "download_limit", "max_file_mb"
  FROM "core"."data_export_runs";

DROP TABLE "core"."data_export_runs";
ALTER TABLE "core"."data_export_runs_new" RENAME TO "data_export_runs";

CREATE INDEX "core"."idx_core_data_export_active" ON "data_export_runs" ("requested_at");
CREATE INDEX "core"."idx_core_data_export_expiring" ON "data_export_runs" ("expires_at");
CREATE INDEX "core"."idx_core_data_export_requested" ON "data_export_runs" ("requested_at");
CREATE INDEX "core"."idx_core_data_export_self" ON "data_export_runs" ("requested_by", "requested_at");

COMMIT;
PRAGMA foreign_keys = ON;
