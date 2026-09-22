-- Hot-restore history: one row per restore performed from the admin console.
-- See the PostgreSQL migration of the same name for the rationale. `safety_file`
-- is the automatic backup taken just before the restore; both file columns hold
-- base names inside the backup destination, never paths or credentials.
CREATE TABLE `backup_restores` (
    `id`            BINARY(16)   NOT NULL,
    `triggered_by`  BINARY(16),
    `actor_label`   VARCHAR(255),
    `status`        VARCHAR(20)  NOT NULL DEFAULT 'running',
    `source_file`   VARCHAR(255) NOT NULL,
    `safety_file`   VARCHAR(255),
    `format`        VARCHAR(20),
    `started_at`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `finished_at`   DATETIME(6),
    `duration_ms`   BIGINT,
    `schemas_count` INT,
    `rows_count`    BIGINT,
    `error`         TEXT,
    CHECK (`status` IN ('running', 'success', 'failed')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`triggered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_core_backup_restores_started` ON `backup_restores` (`started_at`);
