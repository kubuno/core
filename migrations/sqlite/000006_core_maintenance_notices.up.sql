-- Active maintenance notices (SQLite form). Additive on top of the consolidated
-- `000001_core_schema`, schema-qualified so a prefixed instance's DDL lands in
-- its own attached database. See ../postgres/000143 for the rationale and column
-- semantics. `scope` is 'global' (whole instance) or a module id; `message` is a
-- short line, already free of any secret.
CREATE TABLE "core"."maintenance_notices" (
    "id"         BLOB NOT NULL,
    "scope"      TEXT NOT NULL,
    "message"    TEXT NOT NULL,
    "kind"       TEXT NOT NULL DEFAULT 'maintenance',
    "started_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("id")
);

CREATE INDEX "core"."idx_core_maintenance_notices_started" ON "maintenance_notices" ("started_at");
