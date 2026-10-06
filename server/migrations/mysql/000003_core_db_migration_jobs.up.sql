-- Engine-switch jobs (MySQL/MariaDB form). Additive on top of the consolidated
-- schema. See ../postgres/000140 for column semantics.
CREATE TABLE `db_migration_jobs` (
    `id`             BINARY(16)   NOT NULL,
    `scope`          VARCHAR(100) NOT NULL,
    `source_engine`  VARCHAR(20)  NOT NULL,
    `target_engine`  VARCHAR(20)  NOT NULL,
    `status`         VARCHAR(20)  NOT NULL DEFAULT 'pending',
    `tables_total`   INT          NOT NULL DEFAULT 0,
    `tables_done`    INT          NOT NULL DEFAULT 0,
    `total_rows`     BIGINT       NOT NULL DEFAULT 0,
    `copied_rows`    BIGINT       NOT NULL DEFAULT 0,
    `current_table`  VARCHAR(255) NOT NULL DEFAULT '',
    `error`          TEXT         NOT NULL,
    `created_at`     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at`     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    KEY `db_migration_jobs_scope_idx` (`scope`, `created_at`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
