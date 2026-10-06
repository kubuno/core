-- Registry of known database connections per scope (SQLite form).
--
-- Additive on top of the consolidated `000001_core_schema`, schema-qualified so a
-- prefixed instance's DDL lands in its own attached database (see the migrator's
-- prefix rewrite). Column semantics: ../postgres/000141.
CREATE TABLE "core"."db_connections" (
    "id"             BLOB    NOT NULL,
    "scope"          TEXT    NOT NULL,
    "engine"         TEXT    NOT NULL,
    "host"           TEXT    NOT NULL DEFAULT '',
    "port"           INTEGER NOT NULL DEFAULT 0,
    "db_user"        TEXT    NOT NULL DEFAULT '',
    "password_enc"   TEXT    NOT NULL DEFAULT '',
    "db_name"        TEXT    NOT NULL DEFAULT '',
    "db_path"        TEXT    NOT NULL DEFAULT '',
    "schema_prefix"  TEXT,
    "label"          TEXT,
    "is_current"     INTEGER NOT NULL DEFAULT 0,
    "created_at"     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_used_at"   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_synced_at" TEXT,
    PRIMARY KEY ("id"),
    UNIQUE ("scope", "engine", "host", "port", "db_name", "db_path")
);

CREATE INDEX "core"."db_connections_scope_idx" ON "db_connections" ("scope", "created_at");
