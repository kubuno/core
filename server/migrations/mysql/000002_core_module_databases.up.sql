-- Per-module database override (MySQL/MariaDB form of core.module_databases).
--
-- Additive migration on top of the consolidated `000001_core_schema`: it adds a
-- single table, so an already-migrated instance applies it without touching the
-- frozen consolidated schema. See ../postgres/000139 for the column semantics.
CREATE TABLE `module_databases` (
    `module_id`     VARCHAR(100) NOT NULL,
    `engine`        VARCHAR(20)  NOT NULL DEFAULT 'postgres',
    `host`          VARCHAR(255) NOT NULL DEFAULT '',
    `port`          INT          NOT NULL DEFAULT 0,
    `db_user`       VARCHAR(255) NOT NULL DEFAULT '',
    `password_enc`  TEXT         NOT NULL,
    `db_name`       VARCHAR(255) NOT NULL DEFAULT '',
    `db_path`       VARCHAR(1000) NOT NULL DEFAULT '',
    `schema_prefix` VARCHAR(32),
    `enabled`       BOOLEAN      NOT NULL DEFAULT TRUE,
    `created_at`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`module_id`),
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
