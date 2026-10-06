-- Per-module database override (SQLite form of core.module_databases).
--
-- Additive migration on top of the consolidated `000001_core_schema`: it adds a
-- single schema-qualified table, so an already-migrated instance applies it
-- without touching the frozen consolidated schema. Qualified names let a
-- prefixed instance's DDL land in its own attached database (see the migrator's
-- prefix rewrite). Column semantics: ../postgres/000139.
CREATE TABLE "core"."module_databases" (
    "module_id"     TEXT NOT NULL,
    "engine"        TEXT NOT NULL DEFAULT 'postgres',
    "host"          TEXT NOT NULL DEFAULT '',
    "port"          INTEGER NOT NULL DEFAULT 0,
    "db_user"       TEXT NOT NULL DEFAULT '',
    "password_enc"  TEXT NOT NULL DEFAULT '',
    "db_name"       TEXT NOT NULL DEFAULT '',
    "db_path"       TEXT NOT NULL DEFAULT '',
    "schema_prefix" TEXT,
    "enabled"       INTEGER NOT NULL DEFAULT 1,
    "created_at"    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at"    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("module_id"),
    FOREIGN KEY ("module_id") REFERENCES "modules" ("id") ON DELETE CASCADE
);
