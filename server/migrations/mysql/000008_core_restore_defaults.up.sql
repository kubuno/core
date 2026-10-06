-- Restores the defaults the MySQL/MariaDB core schema lost in translation
-- (consolidated 000001 and the additive 000002-000004), mirroring PostgreSQL.
--
-- PostgreSQL gives every UUID key `DEFAULT uuid_generate_v4()`, and the core
-- relies on it: a refresh token, an alert, a job… are inserted without an id.
-- On MySQL those columns had no default, so each such INSERT failed with 1364
-- "Field 'id' doesn't have a default value" — signing in returned 500.
-- The expression below (MySQL >= 8.0.13, MariaDB >= 10.2) yields the 16 bytes
-- of a fresh UUID in the byte order the application uses (BIN_TO_UUID without
-- swap reads it back).
--
-- Three TEXT columns also lost their PostgreSQL `DEFAULT ''`. A TEXT default
-- must be an expression, which ALTER COLUMN … SET DEFAULT does not accept for a
-- TEXT column, hence the MODIFY.
ALTER TABLE `alert_views` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `alerts` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `api_tokens` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `backup_restores` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `backup_runs` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `buildings` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `captcha_challenges` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `clipboard_items` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `collab_updates` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `content_detectors` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `data_export_runs` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `data_export_subjects` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `devices` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `domains` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `holiday_calendars` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `holiday_unit_prefs` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `holidays` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `instance_identity` ALTER COLUMN `instance_id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `jobs` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `label_links` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `label_shares` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `labels` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `ldap_directories` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `maintenance_notices` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `migration_accounts` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `migration_campaigns` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `module_instances` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `oauth_providers` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `org_units` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `push_devices` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `reauth_grants` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `refresh_tokens` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `remote_mounts` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `resource_features` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `resources` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `role_assignments` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `roles` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `rule_backtests` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `rules` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `target_audiences` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `tls_certificates` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `totp_backup_codes` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `user_groups` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `users` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));
ALTER TABLE `verification_tokens` ALTER COLUMN `id` SET DEFAULT (UNHEX(REPLACE(UUID(), '-', '')));

ALTER TABLE `module_databases` MODIFY COLUMN `password_enc` TEXT NOT NULL DEFAULT ('');
ALTER TABLE `db_migration_jobs` MODIFY COLUMN `error` TEXT NOT NULL DEFAULT ('');
ALTER TABLE `db_connections` MODIFY COLUMN `password_enc` TEXT NOT NULL DEFAULT ('');