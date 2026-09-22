-- Active maintenance notices (MySQL/MariaDB form). Additive on top of the
-- consolidated `000001_core_schema`. See ../postgres/000143 for the rationale
-- and column semantics. `scope` is 'global' (whole instance) or a module id;
-- `message` is a short line, already free of any secret.
CREATE TABLE `maintenance_notices` (
    `id`         BINARY(16)   NOT NULL,
    `scope`      VARCHAR(100) NOT NULL,
    `message`    TEXT         NOT NULL,
    `kind`       VARCHAR(50)  NOT NULL DEFAULT 'maintenance',
    `started_at` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_core_maintenance_notices_started` ON `maintenance_notices` (`started_at`);
