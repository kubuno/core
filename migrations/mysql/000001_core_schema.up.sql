-- MySQL / MariaDB — consolidated `core` schema, the FINAL shape the
-- PostgreSQL migrations 000001..000138 reach. The `core` database is
-- created by kubuno-db before the migrator runs; identifiers are
-- unqualified and back-ticked. Foreign-key checks are disabled while the
-- tables are created because they reference one another out of order.
--
-- Type/behaviour mapping (see notes/media for the same rules):
--   UUID/citext  -> BINARY(16) / VARCHAR; DATETIME(6) is UTC; JSONB/JSON
--   -> JSON; TEXT[] list columns -> JSON arrays; BIGSERIAL -> AUTO_INCREMENT.
--   plpgsql triggers (set_updated_at, hash chains, audience pruning,
--   setting mirrors, org-unit placement, jobs NOTIFY) are enforced in
--   Rust; only updated_at keeps a DB default via ON UPDATE. Partial and
--   expression UNIQUE indexes are enforced in Rust; plain partial indexes
--   are flattened to full indexes. tsvector/GIN search -> ILIKE per engine.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `acme_state` (
    `id` BOOLEAN NOT NULL DEFAULT TRUE,
    `directory_url` TEXT,
    `email` TEXT,
    `last_order_status` VARCHAR(20),
    `last_order_detail` TEXT,
    `last_attempt_at` DATETIME(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CHECK (`last_order_status` IN ('ok', 'error', 'pending')),
    PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `admin_audit` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `occurred_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `actor_id` BINARY(16),
    `actor_label` VARCHAR(320) NOT NULL,
    `actor_role` VARCHAR(20),
    `actor_origin` VARCHAR(20) NOT NULL DEFAULT 'session',
    `actor_token_id` BINARY(16),
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    `action` VARCHAR(120) NOT NULL,
    `module_id` VARCHAR(100),
    `target_type` VARCHAR(60),
    `target_id` VARCHAR(255),
    `target_label` VARCHAR(320),
    `before` JSON,
    `after` JSON,
    `outcome` VARCHAR(16) NOT NULL DEFAULT 'success',
    `detail` TEXT,
    `reversible` BOOLEAN NOT NULL DEFAULT FALSE,
    `reverts_entry_id` BIGINT,
    `reverted_by_entry_id` BIGINT,
    `prev_hash` LONGBLOB,
    `row_hash` LONGBLOB,
    CHECK (`actor_origin` IN ('session', 'api_token', 'internal', 'system')),
    CHECK (`outcome` IN ('success', 'denied', 'error')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`reverted_by_entry_id`) REFERENCES `admin_audit` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`reverts_entry_id`) REFERENCES `admin_audit` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `alert_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `alert_id` BINARY(16) NOT NULL,
    `kind` VARCHAR(24) NOT NULL,
    `actor_id` BINARY(16),
    `actor_label` VARCHAR(320) NOT NULL,
    `from_value` VARCHAR(320),
    `to_value` VARCHAR(320),
    `body` TEXT,
    `occurred_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CHECK (`kind` IN ('created', 'status', 'severity', 'assigned', 'comment', 'recurrence')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`alert_id`) REFERENCES `alerts` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `alert_views` (
    `id` BINARY(16) NOT NULL,
    `owner_id` BINARY(16) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `filters` JSON NOT NULL DEFAULT ('{}'),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE (`owner_id`, `name`),
    FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `alerts` (
    `id` BINARY(16) NOT NULL,
    `source` VARCHAR(60) NOT NULL,
    `kind` VARCHAR(100) NOT NULL,
    `severity` VARCHAR(16) NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'new',
    `title` VARCHAR(255) NOT NULL,
    `summary` TEXT,
    `payload` JSON NOT NULL DEFAULT ('{}'),
    `module_id` VARCHAR(100),
    `subject_user_id` BINARY(16),
    `org_unit_id` BINARY(16),
    `dedup_key` VARCHAR(255) NOT NULL,
    `occurrences` INT NOT NULL DEFAULT 1,
    `first_seen_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_seen_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `assignee_id` BINARY(16),
    `assigned_at` DATETIME(6),
    `closed_at` DATETIME(6),
    `closed_by` BINARY(16),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `is_simulation` BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (`status` IN ('resolved', 'ignored')),
    CHECK (`severity` IN ('critical', 'warning', 'info')),
    CHECK (`status` IN ('new', 'acknowledged', 'resolved', 'ignored')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`org_unit_id`) REFERENCES `org_units` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`subject_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `api_tokens` (
    `id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_used_at` DATETIME(6),
    `revoked_at` DATETIME(6),
    `scopes` JSON NOT NULL DEFAULT ('[]'),
    `is_legacy` BOOLEAN NOT NULL DEFAULT FALSE,
    `legacy_since` DATETIME(6),
    PRIMARY KEY (`id`),
    UNIQUE (`token_hash`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `backup_runs` (
    `id` BINARY(16) NOT NULL,
    `trigger_kind` VARCHAR(20) NOT NULL,
    `triggered_by` BINARY(16),
    `actor_label` VARCHAR(255),
    `status` VARCHAR(20) NOT NULL DEFAULT 'running',
    `started_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `finished_at` DATETIME(6),
    `duration_ms` BIGINT,
    `file_name` VARCHAR(255),
    `destination` TEXT,
    `size_bytes` BIGINT,
    `tables_count` INT,
    `rows_count` BIGINT,
    `error` TEXT,
    `file_pruned` BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (`status` IN ('running', 'success', 'failed')),
    CHECK (`trigger_kind` IN ('scheduled', 'manual')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`triggered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `building_floors` (
    `building_id` BINARY(16) NOT NULL,
    `name` VARCHAR(15) NOT NULL,
    `position` SMALLINT NOT NULL,
    PRIMARY KEY (`building_id`, `name`),
    FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `buildings` (
    `id` BINARY(16) NOT NULL,
    `building_key` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100),
    `address` TEXT NOT NULL,
    `description` VARCHAR(256),
    `latitude` DECIMAL(9,6),
    `longitude` DECIMAL(9,6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `captcha_challenges` (
    `id` BINARY(16) NOT NULL,
    `answer` TEXT NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `consumed` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `kind` TEXT NOT NULL DEFAULT 'text',
    PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `clipboard_items` (
    `id` BINARY(16) NOT NULL,
    `owner_id` BINARY(16) NOT NULL,
    `module` VARCHAR(100) NOT NULL,
    `kind` VARCHAR(100) NOT NULL,
    `title` VARCHAR(500),
    `preview` TEXT,
    `payload` JSON NOT NULL,
    `href` VARCHAR(1000),
    `pinned` BOOLEAN NOT NULL DEFAULT FALSE,
    `fingerprint` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE (`owner_id`, `fingerprint`),
    FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `collab_snapshots` (
    `room` VARCHAR(200) NOT NULL,
    `snapshot` LONGBLOB NOT NULL,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`room`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `collab_updates` (
    `id` BINARY(16) NOT NULL,
    `room` VARCHAR(200) NOT NULL,
    `update_data` LONGBLOB NOT NULL,
    `origin` BINARY(16),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `content_detectors` (
    `id` BINARY(16) NOT NULL,
    `key` VARCHAR(120) NOT NULL,
    `label` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `category` VARCHAR(40) NOT NULL DEFAULT 'other',
    `kind` VARCHAR(16) NOT NULL,
    `pattern` TEXT,
    `terms` JSON NOT NULL DEFAULT ('[]'),
    `checksum` VARCHAR(16),
    `proximity_terms` JSON NOT NULL DEFAULT ('[]'),
    `proximity_window` INT NOT NULL DEFAULT 120,
    `proximity_required` BOOLEAN NOT NULL DEFAULT FALSE,
    `base_confidence` FLOAT NOT NULL DEFAULT 0.5,
    `checksum_bonus` FLOAT NOT NULL DEFAULT 0.35,
    `proximity_bonus` FLOAT NOT NULL DEFAULT 0.20,
    `min_confidence` FLOAT NOT NULL DEFAULT 0.7,
    `min_matches` INT NOT NULL DEFAULT 1,
    `min_unique_matches` INT NOT NULL DEFAULT 1,
    `is_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `is_builtin` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    `updated_by` BINARY(16),
    CHECK (`checksum` IN ('luhn', 'iban', 'nir', 'siret', 'rib_fr')),
    CHECK (`kind` IN ('regex', 'wordlist', 'checksum')),
    PRIMARY KEY (`id`),
    UNIQUE (`key`),
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `data_export_runs` (
    `id` BINARY(16) NOT NULL,
    `scope` VARCHAR(20) NOT NULL,
    `services` JSON NOT NULL DEFAULT ('[]'),
    `with_instance` BOOLEAN NOT NULL DEFAULT FALSE,
    `requested_by` BINARY(16),
    `actor_label` VARCHAR(255),
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `requested_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `started_at` DATETIME(6),
    `finished_at` DATETIME(6),
    `duration_ms` BIGINT,
    `available_at` DATETIME(6) NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `subjects_total` INT NOT NULL DEFAULT 0,
    `subjects_done` INT NOT NULL DEFAULT 0,
    `file_name` VARCHAR(255),
    `destination` TEXT,
    `size_bytes` BIGINT,
    `entries_count` INT,
    `error` TEXT,
    `file_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
    `deleted_at` DATETIME(6),
    `download_count` INT NOT NULL DEFAULT 0,
    `last_downloaded_at` DATETIME(6),
    `last_downloaded_by` BINARY(16),
    `origin` VARCHAR(20) NOT NULL DEFAULT 'admin',
    `download_limit` INT,
    `max_file_mb` INT,
    CHECK (`status` IN ('pending', 'running')),
    CHECK (`origin` IN ('admin', 'self')),
    CHECK (`scope` IN ('instance', 'accounts')),
    CHECK (`status` IN ('pending', 'running', 'ready', 'failed', 'cancelled', 'expired')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`last_downloaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `data_export_subjects` (
    `id` BINARY(16) NOT NULL,
    `export_id` BINARY(16) NOT NULL,
    `user_id` BINARY(16),
    `user_label` VARCHAR(255) NOT NULL,
    `folder` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `size_bytes` BIGINT,
    `services_ok` JSON NOT NULL DEFAULT ('[]'),
    `services_ko` JSON NOT NULL DEFAULT ('[]'),
    `error` TEXT,
    `finished_at` DATETIME(6),
    CHECK (`status` IN ('pending', 'done', 'partial', 'failed')),
    PRIMARY KEY (`id`),
    UNIQUE (`export_id`, `user_id`),
    FOREIGN KEY (`export_id`) REFERENCES `data_export_runs` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `device_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `device_id` BINARY(16) NOT NULL,
    `occurred_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `kind` VARCHAR(32) NOT NULL,
    `ip_address` VARCHAR(45),
    `country` CHAR(2),
    `actor_id` BINARY(16),
    `actor_label` VARCHAR(255),
    `detail` TEXT,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `devices` (
    `id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `correlation_hash` CHAR(64) NOT NULL,
    `correlation_kind` VARCHAR(16) NOT NULL DEFAULT 'key',
    `label` VARCHAR(255),
    `device_type` VARCHAR(16) NOT NULL DEFAULT 'unknown',
    `client_kind` VARCHAR(16),
    `platform` VARCHAR(64),
    `platform_version` VARCHAR(64),
    `browser` VARCHAR(64),
    `browser_version` VARCHAR(64),
    `user_agent` TEXT,
    `signal_level` VARCHAR(16) NOT NULL DEFAULT 'observed',
    `disk_encrypted` BOOLEAN,
    `screen_lock` BOOLEAN,
    `declared_platform` VARCHAR(64),
    `declared_version` VARCHAR(64),
    `declared_app_version` VARCHAR(64),
    `declared_at` DATETIME(6),
    `first_seen_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_seen_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_ip` VARCHAR(45),
    `last_country` CHAR(2),
    `approval` VARCHAR(16) NOT NULL DEFAULT 'pending',
    `approval_by` BINARY(16),
    `approval_label` VARCHAR(255),
    `approval_at` DATETIME(6),
    `approval_reason` TEXT,
    CHECK (`approval` IN ('pending', 'approved', 'blocked')),
    CHECK (`correlation_kind` IN ('key', 'fingerprint')),
    CHECK (`device_type` IN ('desktop', 'mobile', 'tablet', 'tv', 'bot', 'api', 'unknown')),
    CHECK (`signal_level` IN ('observed', 'declared', 'attested')),
    PRIMARY KEY (`id`),
    UNIQUE (`user_id`, `correlation_hash`),
    FOREIGN KEY (`approval_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `domains` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(253) NOT NULL,
    `kind` VARCHAR(16) NOT NULL,
    `parent_id` BINARY(16),
    `verify_token` VARCHAR(64) NOT NULL,
    `verified_at` DATETIME(6),
    `last_checked_at` DATETIME(6),
    `last_error` TEXT,
    `mx_hosts` JSON NOT NULL DEFAULT ('[]'),
    `has_spf` BOOLEAN,
    `has_dmarc` BOOLEAN,
    `mail_checked_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    CHECK (`kind` IN ('primary', 'secondary', 'alias')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`parent_id`) REFERENCES `domains` (`id`) ON DELETE RESTRICT
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `event_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `event_type` VARCHAR(100) NOT NULL,
    `source_module` VARCHAR(100),
    `payload` JSON NOT NULL DEFAULT ('{}'),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `depth` SMALLINT NOT NULL DEFAULT 0,
    `cause_rule_id` BINARY(16),
    PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `health_check_mutes` (
    `check_id` VARCHAR(100) NOT NULL,
    `muted_by` BINARY(16),
    `muted_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `reason` TEXT,
    PRIMARY KEY (`check_id`),
    FOREIGN KEY (`muted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `holiday_calendars` (
    `id` BINARY(16) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `country_code` CHAR(2),
    `subdivision` VARCHAR(40),
    `parent_id` BINARY(16),
    `name` VARCHAR(160) NOT NULL,
    `names` JSON NOT NULL DEFAULT ('{}'),
    `is_builtin` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_overridden` BOOLEAN NOT NULL DEFAULT FALSE,
    `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `coverage_from` INT,
    `coverage_to` INT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    PRIMARY KEY (`id`),
    UNIQUE (`code`),
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`parent_id`) REFERENCES `holiday_calendars` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `holiday_exclusions` (
    `calendar_id` BINARY(16) NOT NULL,
    `key` VARCHAR(80) NOT NULL,
    PRIMARY KEY (`calendar_id`, `key`),
    FOREIGN KEY (`calendar_id`) REFERENCES `holiday_calendars` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `holiday_unit_prefs` (
    `id` BINARY(16) NOT NULL,
    `org_unit_id` BINARY(16) NOT NULL,
    `calendar_id` BINARY(16),
    `holiday_id` BINARY(16),
    `enabled` BOOLEAN NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`calendar_id`) REFERENCES `holiday_calendars` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`holiday_id`) REFERENCES `holidays` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`org_unit_id`) REFERENCES `org_units` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `holidays` (
    `id` BINARY(16) NOT NULL,
    `calendar_id` BINARY(16) NOT NULL,
    `key` VARCHAR(80) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `names` JSON NOT NULL DEFAULT ('{}'),
    `category` VARCHAR(20) NOT NULL DEFAULT 'public',
    `kind` VARCHAR(16) NOT NULL,
    `rule` JSON NOT NULL,
    `observance` VARCHAR(24) NOT NULL DEFAULT 'none',
    `from_year` INT,
    `to_year` INT,
    `color` VARCHAR(9),
    `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `is_builtin` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_overridden` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_orphan` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    CHECK (`category` IN ('public', 'bank', 'government', 'school', 'optional', 'half_day', 'armed_forces', 'workday', 'observance')),
    CHECK (`kind` IN ('fixed', 'easter', 'nth_weekday', 'dates')),
    CHECK (`observance` IN ('none', 'next_workday', 'nearest_workday', 'sunday_to_monday', 'saturday_to_monday', 'saturday_to_friday')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`calendar_id`) REFERENCES `holiday_calendars` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `idempotency_keys` (
    `id_hash` VARCHAR(64) NOT NULL,
    `actor_hash` VARCHAR(64) NOT NULL,
    `method` VARCHAR(10) NOT NULL,
    `path` TEXT NOT NULL,
    `status_code` INT NOT NULL,
    `content_type` TEXT,
    `body` LONGBLOB NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `expires_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`id_hash`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `instance_identity` (
    `only_row` BOOLEAN NOT NULL DEFAULT TRUE,
    `instance_id` BINARY(16) NOT NULL,
    `installed_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`only_row`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `jobs` (
    `id` BINARY(16) NOT NULL,
    `job_type` VARCHAR(100) NOT NULL,
    `module_id` VARCHAR(100),
    `payload` JSON NOT NULL DEFAULT ('{}'),
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `attempts` INT NOT NULL DEFAULT 0,
    `max_attempts` INT NOT NULL DEFAULT 3,
    `error` TEXT,
    `run_after` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `started_at` DATETIME(6),
    `done_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CHECK (`status` IN ('pending', 'running', 'done', 'failed')),
    PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `label_links` (
    `id` BINARY(16) NOT NULL,
    `label_id` BINARY(16) NOT NULL,
    `owner_id` BINARY(16) NOT NULL,
    `module` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(100) NOT NULL,
    `resource_id` VARCHAR(255) NOT NULL,
    `title` VARCHAR(500),
    `href` VARCHAR(1000),
    `envelope` JSON,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE (`label_id`, `resource_type`, `resource_id`),
    FOREIGN KEY (`label_id`) REFERENCES `labels` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `label_shares` (
    `id` BINARY(16) NOT NULL,
    `label_id` BINARY(16) NOT NULL,
    `user_id` BINARY(16),
    `group_id` BINARY(16),
    `can_manage` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`label_id`) REFERENCES `labels` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `labels` (
    `id` BINARY(16) NOT NULL,
    `owner_id` BINARY(16) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `color` VARCHAR(20) NOT NULL DEFAULT '#1a73e8',
    `description` TEXT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE (`owner_id`, `name`),
    FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `ldap_directories` (
    `id` BINARY(16) NOT NULL,
    `slug` VARCHAR(40) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT FALSE,
    `host` VARCHAR(255) NOT NULL,
    `port` INT NOT NULL DEFAULT 389,
    `security` VARCHAR(16) NOT NULL DEFAULT 'starttls',
    `verify_certificate` BOOLEAN NOT NULL DEFAULT TRUE,
    `ca_certificate` TEXT NOT NULL DEFAULT '',
    `connect_timeout_s` INT NOT NULL DEFAULT 10,
    `bind_dn` VARCHAR(500) NOT NULL DEFAULT '',
    `bind_password_enc` TEXT NOT NULL DEFAULT '',
    `base_dn` VARCHAR(500) NOT NULL,
    `user_filter` VARCHAR(500) NOT NULL DEFAULT '(&(objectClass=inetOrgPerson)(uid={login}))',
    `user_scope` VARCHAR(16) NOT NULL DEFAULT 'subtree',
    `attr_username` VARCHAR(64) NOT NULL DEFAULT 'uid',
    `attr_email` VARCHAR(64) NOT NULL DEFAULT 'mail',
    `attr_display_name` VARCHAR(64) NOT NULL DEFAULT 'cn',
    `attr_unique_id` VARCHAR(64) NOT NULL DEFAULT 'entryUUID',
    `attr_member_of` VARCHAR(64) NOT NULL DEFAULT '',
    `sync_groups` BOOLEAN NOT NULL DEFAULT FALSE,
    `group_base_dn` VARCHAR(500) NOT NULL DEFAULT '',
    `group_filter` VARCHAR(500) NOT NULL DEFAULT '(objectClass=groupOfNames)',
    `attr_group_name` VARCHAR(64) NOT NULL DEFAULT 'cn',
    `attr_group_member` VARCHAR(64) NOT NULL DEFAULT 'member',
    `sync_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
    `sync_interval_min` INT NOT NULL DEFAULT 60,
    `on_missing` VARCHAR(16) NOT NULL DEFAULT 'disable',
    `allow_signup` BOOLEAN NOT NULL DEFAULT TRUE,
    `last_sync_at` DATETIME(6),
    `last_sync_status` VARCHAR(16),
    `last_sync_detail` TEXT,
    `position` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `default_org_unit_id` BINARY(16),
    CHECK (`last_sync_status` IN ('ok', 'partial', 'failed')),
    CHECK (`on_missing` IN ('disable', 'ignore')),
    CHECK (`security` IN ('none', 'starttls', 'ldaps')),
    CHECK (`user_scope` IN ('base', 'onelevel', 'subtree')),
    PRIMARY KEY (`id`),
    UNIQUE (`slug`),
    FOREIGN KEY (`default_org_unit_id`) REFERENCES `org_units` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `login_captcha_gate` (
    `identifier_hash` CHAR(64) NOT NULL,
    `failed_count` INT NOT NULL DEFAULT 0,
    `window_started_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`identifier_hash`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `login_throttle` (
    `user_id` BINARY(16) NOT NULL,
    `failed_attempts` INT NOT NULL DEFAULT 0,
    `window_started_at` DATETIME(6),
    `window_count` INT NOT NULL DEFAULT 0,
    `last_attempt_at` DATETIME(6),
    `locked_until` DATETIME(6),
    `lockout_count` SMALLINT NOT NULL DEFAULT 0,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `migration_accounts` (
    `id` BINARY(16) NOT NULL,
    `campaign_id` BINARY(16) NOT NULL,
    `source_login` VARCHAR(320) NOT NULL,
    `secret_enc` TEXT NOT NULL,
    `target_user_id` BINARY(16) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `items_copied` INT NOT NULL DEFAULT 0,
    `items_total` INT NOT NULL DEFAULT 0,
    `cursor` JSON,
    `attempts` INT NOT NULL DEFAULT 0,
    `error` TEXT,
    `started_at` DATETIME(6),
    `finished_at` DATETIME(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CHECK (`status` IN ('pending', 'running', 'done', 'failed', 'cancelled')),
    PRIMARY KEY (`id`),
    UNIQUE (`campaign_id`, `source_login`),
    FOREIGN KEY (`campaign_id`) REFERENCES `migration_campaigns` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `migration_campaigns` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `service` VARCHAR(30) NOT NULL,
    `module_id` VARCHAR(100) NOT NULL,
    `source_kind` VARCHAR(20) NOT NULL,
    `source_host` VARCHAR(255) NOT NULL,
    `source_port` INT NOT NULL,
    `source_security` VARCHAR(10) NOT NULL,
    `since_date` DATE,
    `exclude_folders` JSON NOT NULL DEFAULT ('[]'),
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `created_by` BINARY(16),
    `actor_label` VARCHAR(255),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `started_at` DATETIME(6),
    `finished_at` DATETIME(6),
    `error` TEXT,
    CHECK (`source_security` IN ('ssl', 'starttls', 'none')),
    CHECK (`status` IN ('draft', 'running', 'paused', 'done', 'failed')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `module_instances` (
    `id` BINARY(16) NOT NULL,
    `module_id` VARCHAR(100) NOT NULL,
    `base_url` VARCHAR(500) NOT NULL,
    `routes` JSON NOT NULL DEFAULT ('[]'),
    `sidebar_items` JSON NOT NULL DEFAULT ('[]'),
    `subscribed_events` JSON NOT NULL DEFAULT ('[]'),
    `status` VARCHAR(20) NOT NULL DEFAULT 'starting',
    `last_heartbeat` DATETIME(6),
    `pid` INT,
    `registered_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `mcp_tools` JSON NOT NULL DEFAULT ('[]'),
    CHECK (`status` IN ('starting', 'healthy', 'degraded', 'stopped')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `module_integrity` (
    `module_id` VARCHAR(100) NOT NULL,
    `last_sha256` VARCHAR(64) NOT NULL,
    `first_seen_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_seen_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `signed` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`module_id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `module_usage_daily` (
    `day` DATE NOT NULL,
    `module_id` VARCHAR(100) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `hits` BIGINT NOT NULL DEFAULT 0,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`day`, `module_id`, `user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `modules` (
    `id` VARCHAR(100) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `version` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `author` VARCHAR(255),
    `license` VARCHAR(50),
    `homepage_url` VARCHAR(1000),
    `runtime` VARCHAR(20) NOT NULL DEFAULT 'rust',
    `dependencies` JSON NOT NULL DEFAULT ('[]'),
    `is_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `is_core_module` BOOLEAN NOT NULL DEFAULT FALSE,
    `config` JSON NOT NULL DEFAULT ('{}'),
    `installed_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `cli_commands` JSON NOT NULL DEFAULT ('[]'),
    CHECK (`runtime` IN ('rust', 'python', 'node', 'binary')),
    PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `oauth_providers` (
    `id` BINARY(16) NOT NULL,
    `slug` VARCHAR(40) NOT NULL,
    `display_name` VARCHAR(100) NOT NULL,
    `issuer_url` VARCHAR(500) NOT NULL,
    `client_id` VARCHAR(255) NOT NULL,
    `client_secret_enc` TEXT NOT NULL DEFAULT '',
    `scopes` VARCHAR(255) NOT NULL DEFAULT 'openid email profile',
    `button_color` VARCHAR(20),
    `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `allow_signup` BOOLEAN NOT NULL DEFAULT TRUE,
    `position` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `claim_username` VARCHAR(64) NOT NULL DEFAULT 'preferred_username',
    `claim_email` VARCHAR(64) NOT NULL DEFAULT 'email',
    `claim_display_name` VARCHAR(64) NOT NULL DEFAULT 'name',
    `claim_groups` VARCHAR(64) NOT NULL DEFAULT 'groups',
    `sync_groups` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`id`),
    UNIQUE (`slug`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `org_units` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `parent_id` BINARY(16),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `description` TEXT,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`parent_id`) REFERENCES `org_units` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `password_history` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BINARY(16) NOT NULL,
    `password_hash` TEXT NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `privileges` (
    `key` VARCHAR(160) NOT NULL,
    `namespace` VARCHAR(100) NOT NULL,
    `domain` VARCHAR(60) NOT NULL,
    `verb` VARCHAR(20) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `is_ou_scopable` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_orphan` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `is_token_grantable` BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (`verb` IN ('read', 'create', 'update', 'delete', 'manage', 'execute')),
    PRIMARY KEY (`key`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `push_devices` (
    `id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `provider` VARCHAR(20) NOT NULL,
    `device_token` TEXT NOT NULL,
    `app_id` VARCHAR(100),
    `locale` VARCHAR(10),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_seen_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CHECK (`provider` IN ('apns', 'fcm', 'unifiedpush')),
    PRIMARY KEY (`id`),
    UNIQUE (`provider`, `device_token`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `push_preferences` (
    `user_id` BINARY(16) NOT NULL,
    `module_id` VARCHAR(100) NOT NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`user_id`, `module_id`, `event_type`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `rate_limit_windows` (
    `key` VARCHAR(255) NOT NULL,
    `window_start` DATETIME(6) NOT NULL,
    `count` INT NOT NULL DEFAULT 1,
    PRIMARY KEY (`key`, `window_start`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `reauth_grants` (
    `id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `jti` BINARY(16) NOT NULL,
    `method` VARCHAR(20) NOT NULL,
    `granted_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `expires_at` DATETIME(6) NOT NULL,
    `grace_until` DATETIME(6) NOT NULL,
    `ip_address` VARCHAR(45),
    CHECK (`method` IN ('password', 'totp', 'backup_code')),
    PRIMARY KEY (`id`),
    UNIQUE (`jti`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `refresh_tokens` (
    `id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `device_name` VARCHAR(255),
    `device_type` VARCHAR(50),
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    `expires_at` DATETIME(6) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_used_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `revoked_at` DATETIME(6),
    `revoke_reason` VARCHAR(100),
    `family_id` BINARY(16),
    `client_type` VARCHAR(20),
    `rotated_to` BINARY(16),
    `device_id` BINARY(16),
    `country` CHAR(2),
    `auth_strength` VARCHAR(20),
    PRIMARY KEY (`id`),
    UNIQUE (`token_hash`),
    FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `remote_mounts` (
    `id` BINARY(16) NOT NULL,
    `owner_id` BINARY(16) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `config_enc` LONGBLOB NOT NULL,
    `mount_name` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'disconnected',
    `last_connected_at` DATETIME(6),
    `last_error` TEXT,
    `remote_quota_bytes` BIGINT,
    `remote_used_bytes` BIGINT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CHECK (`provider` IN ('webdav', 'nextcloud', 'owncloud', 'sftp', 'ftp', 'smb', 'nfs', 'gdrive', 'dropbox', 's3')),
    CHECK (`status` IN ('connected', 'disconnected', 'error', 'syncing')),
    PRIMARY KEY (`id`),
    UNIQUE (`owner_id`, `mount_name`),
    FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `resource_feature_links` (
    `resource_id` BINARY(16) NOT NULL,
    `feature_id` BINARY(16) NOT NULL,
    PRIMARY KEY (`resource_id`, `feature_id`),
    FOREIGN KEY (`feature_id`) REFERENCES `resource_features` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `resource_features` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `description` VARCHAR(256),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `resources` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(45) NOT NULL,
    `building_id` BINARY(16) NOT NULL,
    `category` VARCHAR(20) NOT NULL,
    `resource_type` VARCHAR(45),
    `floor_name` VARCHAR(15) NOT NULL,
    `floor_section` VARCHAR(15),
    `capacity` INT NOT NULL,
    `user_description` VARCHAR(1000),
    `description` VARCHAR(1000),
    `generated_name` VARCHAR(400) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    `release_exempt` BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (`category` IN ('meeting_room', 'other')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`building_id`, `floor_name`) REFERENCES `building_floors` (`building_id`, `name`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `role_assignments` (
    `id` BINARY(16) NOT NULL,
    `role_id` BINARY(16) NOT NULL,
    `subject_user_id` BINARY(16),
    `subject_group_id` BINARY(16),
    `scope` VARCHAR(16) NOT NULL,
    `scope_org_unit_id` BINARY(16),
    `expires_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    CHECK (`scope` IN ('instance', 'org_unit')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`scope_org_unit_id`) REFERENCES `org_units` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`subject_group_id`) REFERENCES `user_groups` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`subject_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `role_privileges` (
    `role_id` BINARY(16) NOT NULL,
    `privilege_key` VARCHAR(160) NOT NULL,
    PRIMARY KEY (`role_id`, `privilege_key`),
    FOREIGN KEY (`privilege_key`) REFERENCES `privileges` (`key`) ON DELETE RESTRICT,
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `roles` (
    `id` BINARY(16) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `is_system` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_superuser` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE (`slug`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `rule_actions` (
    `key` VARCHAR(160) NOT NULL,
    `module_id` VARCHAR(100) NOT NULL,
    `label` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `endpoint` VARCHAR(500),
    `params_schema` JSON NOT NULL DEFAULT ('[]'),
    `is_blocking` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_reversible` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_orphan` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`key`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `rule_backtests` (
    `id` BINARY(16) NOT NULL,
    `rule_id` BINARY(16) NOT NULL,
    `rule_version` INT NOT NULL,
    `window_from` DATETIME(6) NOT NULL,
    `window_to` DATETIME(6) NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'pending',
    `report` JSON NOT NULL DEFAULT ('{}'),
    `error` TEXT,
    `requested_by` BINARY(16),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `completed_at` DATETIME(6),
    CHECK (`status` IN ('pending', 'running', 'done', 'failed')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`rule_id`) REFERENCES `rules` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `rule_executions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `rule_id` BINARY(16) NOT NULL,
    `rule_version` INT NOT NULL,
    `mode` VARCHAR(16) NOT NULL,
    `outcome` VARCHAR(24) NOT NULL,
    `event_type` VARCHAR(160) NOT NULL,
    `actor_user_id` BINARY(16),
    `org_unit_id` BINARY(16),
    `resource_type` VARCHAR(60),
    `resource_id` VARCHAR(120),
    `detail` JSON NOT NULL DEFAULT ('{}'),
    `actions_total` SMALLINT NOT NULL DEFAULT 0,
    `actions_ok` SMALLINT NOT NULL DEFAULT 0,
    `actions_failed` SMALLINT NOT NULL DEFAULT 0,
    `depth` SMALLINT NOT NULL DEFAULT 0,
    `duration_ms` INT NOT NULL DEFAULT 0,
    `occurred_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `gate_reference` VARCHAR(16),
    CHECK (`mode` IN ('simulate', 'monitor', 'enforce', 'backtest')),
    CHECK (`outcome` IN ('matched', 'acted', 'no_match', 'out_of_scope', 'out_of_rollout', 'below_threshold', 'depth_exceeded', 'error')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`org_unit_id`) REFERENCES `org_units` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`rule_id`) REFERENCES `rules` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `rule_hits` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `rule_id` BINARY(16) NOT NULL,
    `subject_key` VARCHAR(200) NOT NULL,
    `occurred_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`rule_id`) REFERENCES `rules` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `rule_triggers` (
    `key` VARCHAR(160) NOT NULL,
    `module_id` VARCHAR(100) NOT NULL,
    `event_type` VARCHAR(160) NOT NULL,
    `label` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `fields` JSON NOT NULL DEFAULT ('[]'),
    `is_orphan` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`key`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `rule_versions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `rule_id` BINARY(16) NOT NULL,
    `version` INT NOT NULL,
    `snapshot` JSON NOT NULL,
    `change_note` VARCHAR(500),
    `changed_by` BINARY(16),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE (`rule_id`, `version`),
    FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`rule_id`) REFERENCES `rules` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `rules` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `trigger_key` VARCHAR(160) NOT NULL,
    `conditions` JSON NOT NULL DEFAULT ('{"of": [], "type": "all"}'),
    `actions` JSON NOT NULL DEFAULT ('[]'),
    `mode` VARCHAR(16) NOT NULL DEFAULT 'inactive',
    `scope` JSON NOT NULL DEFAULT ('{"exclude": [], "include": []}'),
    `threshold_count` INT,
    `threshold_window_s` INT,
    `rollout_percent` SMALLINT NOT NULL DEFAULT 100,
    `severity` VARCHAR(16) NOT NULL DEFAULT 'warning',
    `priority` INT NOT NULL DEFAULT 100,
    `version` INT NOT NULL DEFAULT 1,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    `updated_by` BINARY(16),
    CHECK (`mode` IN ('inactive', 'simulate', 'monitor', 'enforce')),
    CHECK (`severity` IN ('critical', 'warning', 'info')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`trigger_key`) REFERENCES `rule_triggers` (`key`) ON DELETE RESTRICT,
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `setting_values` (
    `key` VARCHAR(255) NOT NULL,
    `scope_type` VARCHAR(16) NOT NULL,
    `scope_id` BINARY(16) NOT NULL DEFAULT (UNHEX('00000000000000000000000000000000')),
    `value` JSON NOT NULL,
    `locked` BOOLEAN NOT NULL DEFAULT FALSE,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `updated_by` BINARY(16),
    CHECK (`scope_type` IN ('instance', 'org_unit', 'group', 'user')),
    PRIMARY KEY (`key`, `scope_type`, `scope_id`),
    FOREIGN KEY (`key`) REFERENCES `settings` (`key`) ON DELETE CASCADE,
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `settings` (
    `key` VARCHAR(255) NOT NULL,
    `value` JSON NOT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'general',
    `label` VARCHAR(255),
    `description` TEXT,
    `is_public` BOOLEAN NOT NULL DEFAULT FALSE,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `updated_by` BINARY(16),
    `scope` VARCHAR(20) NOT NULL DEFAULT 'global',
    `value_type` VARCHAR(20),
    `allowed_values` JSON,
    `module_id` VARCHAR(100),
    `default_value` JSON,
    CHECK (`scope` IN ('global', 'user', 'overridable')),
    PRIMARY KEY (`key`),
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `storage_reporters` (
    `module_id` VARCHAR(100) NOT NULL,
    `first_declared_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_declared_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_full_sync_at` DATETIME(6),
    `declarations` BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`module_id`),
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `storage_samples` (
    `day` DATE NOT NULL,
    `used_bytes` BIGINT NOT NULL,
    `quota_bytes` BIGINT NOT NULL,
    `accounts` INT NOT NULL,
    `over_quota` INT NOT NULL DEFAULT 0,
    `captured_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`day`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `storage_usage` (
    `module_id` VARCHAR(100) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `used_bytes` BIGINT NOT NULL,
    `object_count` BIGINT,
    `declared_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `category` VARCHAR(32) NOT NULL DEFAULT 'content',
    CHECK (`category` IN ('content', 'trash', 'versions', 'retention', 'thumbnails', 'index', 'cache', 'staging', 'system', 'delegated')),
    PRIMARY KEY (`module_id`, `user_id`, `category`),
    FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `support_contract` (
    `only_row` BOOLEAN NOT NULL DEFAULT TRUE,
    `key_text` TEXT NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `key_id` VARCHAR(64),
    `subject` VARCHAR(255) NOT NULL,
    `plan` VARCHAR(120),
    `perimeter` TEXT,
    `contact` VARCHAR(320),
    `issued_at` DATETIME(6),
    `expires_at` DATETIME(6),
    `registered_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `registered_by` BINARY(16),
    PRIMARY KEY (`only_row`),
    FOREIGN KEY (`registered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `target_audience_members` (
    `audience_id` BINARY(16) NOT NULL,
    `member_type` VARCHAR(10) NOT NULL,
    `member_id` BINARY(16) NOT NULL,
    `added_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `added_by` BINARY(16),
    CHECK (`member_type` IN ('user', 'group')),
    PRIMARY KEY (`audience_id`, `member_type`, `member_id`),
    FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`audience_id`) REFERENCES `target_audiences` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `target_audience_policies` (
    `org_unit_id` BINARY(16) NOT NULL,
    `module_id` VARCHAR(100) NOT NULL,
    `audience_id` BINARY(16) NOT NULL,
    `position` SMALLINT NOT NULL,
    PRIMARY KEY (`org_unit_id`, `module_id`, `audience_id`),
    FOREIGN KEY (`audience_id`) REFERENCES `target_audiences` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`org_unit_id`) REFERENCES `org_units` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `target_audiences` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `description` VARCHAR(150),
    `is_everyone` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `created_by` BINARY(16),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `tls_certificates` (
    `id` BINARY(16) NOT NULL,
    `source` VARCHAR(20) NOT NULL DEFAULT 'upload',
    `subject` TEXT,
    `issuer` TEXT,
    `san` JSON NOT NULL DEFAULT ('[]'),
    `not_before` DATETIME(6),
    `not_after` DATETIME(6),
    `is_active` BOOLEAN NOT NULL DEFAULT FALSE,
    `uploaded_by` BINARY(16),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CHECK (`source` IN ('upload', 'acme')),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `totp_backup_codes` (
    `id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `code_hash` TEXT NOT NULL,
    `generation` INT NOT NULL DEFAULT 1,
    `used_at` DATETIME(6),
    `used_ip` VARCHAR(45),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `user_group_members` (
    `group_id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `added_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `added_by` BINARY(16),
    `source` VARCHAR(16) NOT NULL DEFAULT 'manual',
    CHECK (`source` IN ('manual', 'directory')),
    PRIMARY KEY (`group_id`, `user_id`),
    FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `user_groups` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `permissions` JSON NOT NULL DEFAULT ('[]'),
    `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `is_system` BOOLEAN NOT NULL DEFAULT FALSE,
    `ldap_directory_id` BINARY(16),
    `ldap_dn` VARCHAR(1000),
    `oauth_provider_slug` VARCHAR(40),
    `release_exempt` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`id`),
    UNIQUE (`name`),
    FOREIGN KEY (`ldap_directory_id`) REFERENCES `ldap_directories` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `users` (
    `id` BINARY(16) NOT NULL,
    `email` VARCHAR(320) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255),
    `display_name` VARCHAR(255),
    `avatar_url` VARCHAR(1000),
    `role` VARCHAR(20) NOT NULL DEFAULT 'user',
    `quota_bytes` BIGINT NOT NULL DEFAULT 10737418240,
    `used_bytes` BIGINT NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `oauth_provider` VARCHAR(50),
    `oauth_id` VARCHAR(255),
    `preferences` JSON NOT NULL DEFAULT ('{}'),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `last_login_at` DATETIME(6),
    `totp_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
    `totp_secret` TEXT,
    `totp_pending_secret` TEXT,
    `org_unit_id` BINARY(16) NOT NULL,
    `must_change_password` BOOLEAN NOT NULL DEFAULT FALSE,
    `admin_2fa_grace_until` DATETIME(6),
    `ldap_directory_id` BINARY(16),
    `ldap_dn` VARCHAR(1000),
    `ldap_uid` VARCHAR(255),
    `ldap_synced_at` DATETIME(6),
    `deleted_at` DATETIME(6),
    `name_pronunciation` VARCHAR(120),
    `pronouns` VARCHAR(60),
    `work_location` VARCHAR(160),
    `introduction` TEXT,
    `gender` VARCHAR(80),
    `birthday` DATE,
    `password_changed_at` DATETIME(6),
    `first_name` VARCHAR(120),
    `last_name` VARCHAR(120),
    CHECK (`role` IN ('user', 'admin', 'guest')),
    PRIMARY KEY (`id`),
    UNIQUE (`oauth_provider`, `oauth_id`),
    UNIQUE (`email`),
    UNIQUE (`username`),
    FOREIGN KEY (`ldap_directory_id`) REFERENCES `ldap_directories` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`org_unit_id`) REFERENCES `org_units` (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `verification_tokens` (
    `id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `purpose` VARCHAR(50) NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `used_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CHECK (`purpose` IN ('email_verify', 'password_reset', 'invite')),
    PRIMARY KEY (`id`),
    UNIQUE (`token_hash`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX `idx_core_alert_events_alert` ON `alert_events` (`alert_id`, `occurred_at`, `id`);
CREATE INDEX `idx_core_alert_views_owner` ON `alert_views` (`owner_id`, `name`);
CREATE INDEX `idx_core_alerts_assignee` ON `alerts` (`assignee_id`);
CREATE INDEX `idx_core_alerts_created` ON `alerts` (`created_at`);
CREATE INDEX `idx_core_alerts_kind` ON `alerts` (`kind`, `last_seen_at`);
CREATE INDEX `idx_core_alerts_open` ON `alerts` (`severity`, `last_seen_at`);
CREATE INDEX `idx_core_alerts_seen` ON `alerts` (`last_seen_at`, `id`);
CREATE INDEX `idx_core_alerts_simulation` ON `alerts` (`is_simulation`);
CREATE INDEX `idx_core_alerts_subject` ON `alerts` (`subject_user_id`);
CREATE INDEX `idx_core_api_tokens_hash` ON `api_tokens` (`token_hash`);
CREATE INDEX `idx_core_api_tokens_legacy` ON `api_tokens` (`is_legacy`);
CREATE INDEX `idx_core_api_tokens_scopes` ON `api_tokens` (`scopes`(191));
CREATE INDEX `idx_core_api_tokens_user` ON `api_tokens` (`user_id`);
CREATE INDEX `idx_core_assign_group` ON `role_assignments` (`subject_group_id`);
CREATE INDEX `idx_core_assign_role` ON `role_assignments` (`role_id`);
CREATE INDEX `idx_core_assign_unit` ON `role_assignments` (`scope_org_unit_id`);
CREATE INDEX `idx_core_assign_user` ON `role_assignments` (`subject_user_id`);
CREATE INDEX `idx_core_audit_action` ON `admin_audit` (`action`, `occurred_at`);
CREATE INDEX `idx_core_audit_actor` ON `admin_audit` (`actor_id`, `occurred_at`);
CREATE INDEX `idx_core_audit_denied` ON `admin_audit` (`occurred_at`);
CREATE INDEX `idx_core_audit_occurred` ON `admin_audit` (`occurred_at`, `id`);
CREATE INDEX `idx_core_audit_target` ON `admin_audit` (`target_type`, `target_id`, `occurred_at`);
CREATE INDEX `idx_core_backup_runs_started` ON `backup_runs` (`started_at`);
CREATE INDEX `idx_core_backup_runs_success` ON `backup_runs` (`finished_at`);
CREATE INDEX `idx_core_captcha_expires` ON `captcha_challenges` (`expires_at`);
CREATE INDEX `idx_core_clipboard_owner_recent` ON `clipboard_items` (`owner_id`, `created_at`);
CREATE INDEX `idx_core_collab_updates_room` ON `collab_updates` (`room`, `created_at`);
CREATE INDEX `idx_core_data_export_active` ON `data_export_runs` (`requested_at`);
CREATE INDEX `idx_core_data_export_expiring` ON `data_export_runs` (`expires_at`);
CREATE INDEX `idx_core_data_export_requested` ON `data_export_runs` (`requested_at`);
CREATE INDEX `idx_core_data_export_self` ON `data_export_runs` (`requested_by`, `requested_at`);
CREATE INDEX `idx_core_data_export_subjects_pending` ON `data_export_subjects` (`export_id`);
CREATE INDEX `idx_core_data_export_subjects_user` ON `data_export_subjects` (`user_id`);
CREATE INDEX `idx_core_detectors_enabled` ON `content_detectors` (`is_enabled`);
CREATE INDEX `idx_core_device_events_device` ON `device_events` (`device_id`, `occurred_at`);
CREATE INDEX `idx_core_device_events_kind_time` ON `device_events` (`kind`, `occurred_at`);
CREATE INDEX `idx_core_devices_approval` ON `devices` (`approval`);
CREATE INDEX `idx_core_devices_country` ON `devices` (`last_country`);
CREATE INDEX `idx_core_devices_last_seen` ON `devices` (`last_seen_at`);
CREATE INDEX `idx_core_devices_platform` ON `devices` (`platform`);
CREATE INDEX `idx_core_devices_user` ON `devices` (`user_id`);
CREATE UNIQUE INDEX `idx_core_domains_name` ON `domains` (`name`);
CREATE INDEX `idx_core_domains_parent` ON `domains` (`parent_id`);
CREATE INDEX `idx_core_el_created` ON `event_log` (`created_at`);
CREATE INDEX `idx_core_el_type` ON `event_log` (`event_type`);
CREATE INDEX `idx_core_el_type_created` ON `event_log` (`event_type`, `created_at`);
CREATE INDEX `idx_core_holiday_calendars_country` ON `holiday_calendars` (`country_code`);
CREATE INDEX `idx_core_holiday_calendars_parent` ON `holiday_calendars` (`parent_id`);
CREATE INDEX `idx_core_holidays_calendar` ON `holidays` (`calendar_id`);
CREATE UNIQUE INDEX `idx_core_holidays_key` ON `holidays` (`calendar_id`, `key`);
CREATE INDEX `idx_core_idem_expires` ON `idempotency_keys` (`expires_at`);
CREATE INDEX `idx_core_jobs_claim` ON `jobs` (`job_type`, `run_after`);
CREATE INDEX `idx_core_jobs_pending` ON `jobs` (`run_after`);
CREATE INDEX `idx_core_jobs_running` ON `jobs` (`started_at`);
CREATE INDEX `idx_core_label_links_label` ON `label_links` (`label_id`);
CREATE INDEX `idx_core_label_links_owner` ON `label_links` (`owner_id`);
CREATE INDEX `idx_core_label_links_resource` ON `label_links` (`resource_type`, `resource_id`);
CREATE INDEX `idx_core_label_links_title_trgm` ON `label_links` (`title`(191));
CREATE INDEX `idx_core_label_shares_label` ON `label_shares` (`label_id`);
CREATE INDEX `idx_core_label_shares_subject` ON `label_shares` (`user_id`, `group_id`);
CREATE INDEX `idx_core_labels_owner` ON `labels` (`owner_id`);
CREATE INDEX `idx_core_ldap_enabled` ON `ldap_directories` (`enabled`);
CREATE INDEX `idx_core_login_captcha_gate_stale` ON `login_captcha_gate` (`updated_at`);
CREATE INDEX `idx_core_login_throttle_locked` ON `login_throttle` (`locked_until`);
CREATE INDEX `idx_core_mi_module` ON `module_instances` (`module_id`);
CREATE INDEX `idx_core_mi_status` ON `module_instances` (`status`);
CREATE INDEX `idx_core_module_usage_day` ON `module_usage_daily` (`day`);
CREATE INDEX `idx_core_ou_parent` ON `org_units` (`parent_id`);
CREATE INDEX `idx_core_priv_namespace` ON `privileges` (`namespace`);
CREATE INDEX `idx_core_priv_scopable` ON `privileges` (`is_ou_scopable`);
CREATE INDEX `idx_core_push_user` ON `push_devices` (`user_id`);
CREATE INDEX `idx_core_reauth_jti` ON `reauth_grants` (`jti`);
CREATE INDEX `idx_core_reauth_user` ON `reauth_grants` (`user_id`, `grace_until`);
CREATE INDEX `idx_core_resources_building` ON `resources` (`building_id`);
CREATE INDEX `idx_core_resources_category` ON `resources` (`category`);
CREATE INDEX `idx_core_rfl_feature` ON `resource_feature_links` (`feature_id`);
CREATE INDEX `idx_core_rl_key` ON `rate_limit_windows` (`key`, `window_start`);
CREATE INDEX `idx_core_rm_owner` ON `remote_mounts` (`owner_id`);
CREATE INDEX `idx_core_rm_status` ON `remote_mounts` (`status`);
CREATE INDEX `idx_core_role_priv_key` ON `role_privileges` (`privilege_key`);
CREATE INDEX `idx_core_rt_active` ON `refresh_tokens` (`last_used_at`);
CREATE INDEX `idx_core_rt_device` ON `refresh_tokens` (`device_id`);
CREATE INDEX `idx_core_rt_expires` ON `refresh_tokens` (`expires_at`);
CREATE INDEX `idx_core_rt_family` ON `refresh_tokens` (`family_id`);
CREATE INDEX `idx_core_rt_hash` ON `refresh_tokens` (`token_hash`);
CREATE INDEX `idx_core_rt_user` ON `refresh_tokens` (`user_id`);
CREATE INDEX `idx_core_rule_actions_module` ON `rule_actions` (`module_id`);
CREATE INDEX `idx_core_rule_backtests_rule` ON `rule_backtests` (`rule_id`, `created_at`);
CREATE INDEX `idx_core_rule_exec_gate_ref` ON `rule_executions` (`gate_reference`);
CREATE INDEX `idx_core_rule_exec_outcome` ON `rule_executions` (`outcome`, `occurred_at`);
CREATE INDEX `idx_core_rule_exec_rule` ON `rule_executions` (`rule_id`, `occurred_at`);
CREATE INDEX `idx_core_rule_exec_time` ON `rule_executions` (`occurred_at`);
CREATE INDEX `idx_core_rule_hits_window` ON `rule_hits` (`rule_id`, `subject_key`, `occurred_at`);
CREATE INDEX `idx_core_rule_triggers_event` ON `rule_triggers` (`event_type`);
CREATE INDEX `idx_core_rule_triggers_module` ON `rule_triggers` (`module_id`);
CREATE INDEX `idx_core_rule_versions_rule` ON `rule_versions` (`rule_id`, `version`);
CREATE INDEX `idx_core_rules_active` ON `rules` (`mode`);
CREATE INDEX `idx_core_rules_trigger` ON `rules` (`trigger_key`);
CREATE INDEX `idx_core_settings_module` ON `settings` (`module_id`);
CREATE INDEX `idx_core_su_user` ON `storage_usage` (`user_id`, `module_id`);
CREATE INDEX `idx_core_sv_locked` ON `setting_values` (`key`);
CREATE INDEX `idx_core_sv_scope` ON `setting_values` (`scope_type`, `scope_id`);
CREATE INDEX `idx_core_tam_member` ON `target_audience_members` (`member_type`, `member_id`);
CREATE INDEX `idx_core_tap_audience` ON `target_audience_policies` (`audience_id`);
CREATE INDEX `idx_core_tbc_user` ON `totp_backup_codes` (`user_id`);
CREATE INDEX `idx_core_tbc_user_unused` ON `totp_backup_codes` (`user_id`);
CREATE INDEX `idx_core_tls_not_after` ON `tls_certificates` (`not_after`);
CREATE INDEX `idx_core_ugm_group` ON `user_group_members` (`group_id`);
CREATE INDEX `idx_core_ugm_source` ON `user_group_members` (`source`);
CREATE INDEX `idx_core_ugm_user` ON `user_group_members` (`user_id`);
CREATE INDEX `idx_core_users_active` ON `users` (`is_active`);
CREATE INDEX `idx_core_users_deleted_at` ON `users` (`deleted_at`);
CREATE INDEX `idx_core_users_email` ON `users` (`email`);
CREATE INDEX `idx_core_users_ldap` ON `users` (`ldap_directory_id`);
CREATE INDEX `idx_core_users_ou` ON `users` (`org_unit_id`);
CREATE INDEX `idx_core_users_role` ON `users` (`role`);
CREATE INDEX `idx_core_vt_hash` ON `verification_tokens` (`token_hash`);
CREATE INDEX `idx_migration_accounts_campaign` ON `migration_accounts` (`campaign_id`, `status`);
CREATE INDEX `idx_migration_accounts_claim` ON `migration_accounts` (`status`, `updated_at`);
CREATE INDEX `idx_migration_accounts_target` ON `migration_accounts` (`target_user_id`);
CREATE INDEX `idx_migration_campaigns_created` ON `migration_campaigns` (`created_at`);
CREATE INDEX `idx_migration_campaigns_status` ON `migration_campaigns` (`status`);
CREATE INDEX `password_history_user_recent_idx` ON `password_history` (`user_id`, `created_at`);

SET FOREIGN_KEY_CHECKS = 1;

