-- Registry of known database connections per scope (MySQL/MariaDB form).
--
-- Additive on top of the consolidated `000001_core_schema`: it adds a single
-- table, so an already-migrated instance applies it without touching the frozen
-- consolidated schema. See ../postgres/000141 for the column semantics.
CREATE TABLE `db_connections` (
    `id`             BINARY(16)    NOT NULL,
    `scope`          VARCHAR(100)  NOT NULL,
    `engine`         VARCHAR(20)   NOT NULL,
    `host`           VARCHAR(255)  NOT NULL DEFAULT '',
    `port`           INT           NOT NULL DEFAULT 0,
    `db_user`        VARCHAR(255)  NOT NULL DEFAULT '',
    `password_enc`   TEXT          NOT NULL,
    `db_name`        VARCHAR(255)  NOT NULL DEFAULT '',
    `db_path`        VARCHAR(1000) NOT NULL DEFAULT '',
    `schema_prefix`  VARCHAR(32),
    `label`          VARCHAR(255),
    `is_current`     BOOLEAN       NOT NULL DEFAULT FALSE,
    `created_at`     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_used_at`   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_synced_at` DATETIME(6),
    PRIMARY KEY (`id`),
    -- Prefix lengths keep the composite key under InnoDB's 3072-byte limit; the
    -- prefixes are long enough to make a real duplicate collision unrealistic.
    UNIQUE KEY `db_connections_identity_uk`
        (`scope`, `engine`, `host`(120), `port`, `db_name`(120), `db_path`(120)),
    KEY `db_connections_scope_idx` (`scope`, `created_at`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
