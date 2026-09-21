-- SQLite — consolidated `core` schema, the FINAL shape the PostgreSQL
-- migrations 000001..000138 reach. `core` is an ATTACHed database file;
-- tables and indexes are qualified `core.`, foreign-key REFERENCES are
-- unqualified (same database), and kubuno-db enables PRAGMA foreign_keys.
--
-- Type/behaviour mapping: UUID -> BLOB, TIMESTAMPTZ -> TEXT (UTC), JSONB/
-- JSON and TEXT[] list columns -> TEXT holding JSON, BOOLEAN -> INTEGER,
-- BIGSERIAL -> INTEGER PRIMARY KEY AUTOINCREMENT. plpgsql triggers and the
-- conditional UNIQUE indexes are enforced in Rust; the one exception is
-- `updated_at`, refreshed by an AFTER-UPDATE trigger per table (see the end of
-- this file), mirroring PostgreSQL's `set_updated_at()`. Plain partial indexes
-- are flattened. tsvector/GIN search -> ILIKE per engine.

CREATE TABLE "core"."acme_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "directory_url" TEXT,
    "email" TEXT,
    "last_order_status" TEXT,
    "last_order_detail" TEXT,
    "last_attempt_at" TEXT,
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    CHECK ("last_order_status" IN ('ok', 'error', 'pending')),
    PRIMARY KEY ("id")
);
CREATE TABLE "core"."admin_audit" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "occurred_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "actor_id" BLOB,
    "actor_label" TEXT NOT NULL,
    "actor_role" TEXT,
    "actor_origin" TEXT NOT NULL DEFAULT 'session',
    "actor_token_id" BLOB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "action" TEXT NOT NULL,
    "module_id" TEXT,
    "target_type" TEXT,
    "target_id" TEXT,
    "target_label" TEXT,
    "before" TEXT,
    "after" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'success',
    "detail" TEXT,
    "reversible" INTEGER NOT NULL DEFAULT 0,
    "reverts_entry_id" INTEGER,
    "reverted_by_entry_id" INTEGER,
    "prev_hash" BLOB,
    "row_hash" BLOB,
    CHECK ("actor_origin" IN ('session', 'api_token', 'internal', 'system')),
    CHECK ("outcome" IN ('success', 'denied', 'error')),
    FOREIGN KEY ("actor_id") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("reverted_by_entry_id") REFERENCES "admin_audit" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("reverts_entry_id") REFERENCES "admin_audit" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."alert_events" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "alert_id" BLOB NOT NULL,
    "kind" TEXT NOT NULL,
    "actor_id" BLOB,
    "actor_label" TEXT NOT NULL,
    "from_value" TEXT,
    "to_value" TEXT,
    "body" TEXT,
    "occurred_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    CHECK ("kind" IN ('created', 'status', 'severity', 'assigned', 'comment', 'recurrence')),
    FOREIGN KEY ("actor_id") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("alert_id") REFERENCES "alerts" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."alert_views" (
    "id" BLOB NOT NULL,
    "owner_id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "filters" TEXT NOT NULL DEFAULT '{}',
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("id"),
    UNIQUE ("owner_id", "name"),
    FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."alerts" (
    "id" BLOB NOT NULL,
    "source" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "module_id" TEXT,
    "subject_user_id" BLOB,
    "org_unit_id" BLOB,
    "dedup_key" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "first_seen_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_seen_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "assignee_id" BLOB,
    "assigned_at" TEXT,
    "closed_at" TEXT,
    "closed_by" BLOB,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "is_simulation" INTEGER NOT NULL DEFAULT 0,
    CHECK ("status" IN ('resolved', 'ignored')),
    CHECK ("severity" IN ('critical', 'warning', 'info')),
    CHECK ("status" IN ('new', 'acknowledged', 'resolved', 'ignored')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("assignee_id") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("closed_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("org_unit_id") REFERENCES "org_units" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("subject_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."api_tokens" (
    "id" BLOB NOT NULL,
    "user_id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_used_at" TEXT,
    "revoked_at" TEXT,
    "scopes" TEXT NOT NULL DEFAULT '[]',
    "is_legacy" INTEGER NOT NULL DEFAULT 0,
    "legacy_since" TEXT,
    PRIMARY KEY ("id"),
    UNIQUE ("token_hash"),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."backup_runs" (
    "id" BLOB NOT NULL,
    "trigger_kind" TEXT NOT NULL,
    "triggered_by" BLOB,
    "actor_label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "started_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "finished_at" TEXT,
    "duration_ms" INTEGER,
    "file_name" TEXT,
    "destination" TEXT,
    "size_bytes" INTEGER,
    "tables_count" INTEGER,
    "rows_count" INTEGER,
    "error" TEXT,
    "file_pruned" INTEGER NOT NULL DEFAULT 0,
    CHECK ("status" IN ('running', 'success', 'failed')),
    CHECK ("trigger_kind" IN ('scheduled', 'manual')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("triggered_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."building_floors" (
    "building_id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    PRIMARY KEY ("building_id", "name"),
    FOREIGN KEY ("building_id") REFERENCES "buildings" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."buildings" (
    "id" BLOB NOT NULL,
    "building_key" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "latitude" NUMERIC,
    "longitude" NUMERIC,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."captcha_challenges" (
    "id" BLOB NOT NULL,
    "answer" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "consumed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "kind" TEXT NOT NULL DEFAULT 'text',
    PRIMARY KEY ("id")
);
CREATE TABLE "core"."clipboard_items" (
    "id" BLOB NOT NULL,
    "owner_id" BLOB NOT NULL,
    "module" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT,
    "preview" TEXT,
    "payload" TEXT NOT NULL,
    "href" TEXT,
    "pinned" INTEGER NOT NULL DEFAULT 0,
    "fingerprint" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("id"),
    UNIQUE ("owner_id", "fingerprint"),
    FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."collab_snapshots" (
    "room" TEXT NOT NULL,
    "snapshot" BLOB NOT NULL,
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("room")
);
CREATE TABLE "core"."collab_updates" (
    "id" BLOB NOT NULL,
    "room" TEXT NOT NULL,
    "update_data" BLOB NOT NULL,
    "origin" BLOB,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("id")
);
CREATE TABLE "core"."content_detectors" (
    "id" BLOB NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "kind" TEXT NOT NULL,
    "pattern" TEXT,
    "terms" TEXT NOT NULL DEFAULT '[]',
    "checksum" TEXT,
    "proximity_terms" TEXT NOT NULL DEFAULT '[]',
    "proximity_window" INTEGER NOT NULL DEFAULT 120,
    "proximity_required" INTEGER NOT NULL DEFAULT 0,
    "base_confidence" REAL NOT NULL DEFAULT 0.5,
    "checksum_bonus" REAL NOT NULL DEFAULT 0.35,
    "proximity_bonus" REAL NOT NULL DEFAULT 0.20,
    "min_confidence" REAL NOT NULL DEFAULT 0.7,
    "min_matches" INTEGER NOT NULL DEFAULT 1,
    "min_unique_matches" INTEGER NOT NULL DEFAULT 1,
    "is_enabled" INTEGER NOT NULL DEFAULT 1,
    "is_builtin" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    "updated_by" BLOB,
    CHECK ("checksum" IN ('luhn', 'iban', 'nir', 'siret', 'rib_fr')),
    CHECK ("kind" IN ('regex', 'wordlist', 'checksum')),
    PRIMARY KEY ("id"),
    UNIQUE ("key"),
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."data_export_runs" (
    "id" BLOB NOT NULL,
    "scope" TEXT NOT NULL,
    "services" TEXT NOT NULL DEFAULT '[]',
    "with_instance" INTEGER NOT NULL DEFAULT 0,
    "requested_by" BLOB,
    "actor_label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "started_at" TEXT,
    "finished_at" TEXT,
    "duration_ms" INTEGER,
    "available_at" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "subjects_total" INTEGER NOT NULL DEFAULT 0,
    "subjects_done" INTEGER NOT NULL DEFAULT 0,
    "file_name" TEXT,
    "destination" TEXT,
    "size_bytes" INTEGER,
    "entries_count" INTEGER,
    "error" TEXT,
    "file_deleted" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TEXT,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_downloaded_at" TEXT,
    "last_downloaded_by" BLOB,
    "origin" TEXT NOT NULL DEFAULT 'admin',
    "download_limit" INTEGER,
    "max_file_mb" INTEGER,
    CHECK ("status" IN ('pending', 'running')),
    CHECK ("origin" IN ('admin', 'self')),
    CHECK ("scope" IN ('instance', 'accounts')),
    CHECK ("status" IN ('pending', 'running', 'ready', 'failed', 'cancelled', 'expired')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("last_downloaded_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("requested_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."data_export_subjects" (
    "id" BLOB NOT NULL,
    "export_id" BLOB NOT NULL,
    "user_id" BLOB,
    "user_label" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "size_bytes" INTEGER,
    "services_ok" TEXT NOT NULL DEFAULT '[]',
    "services_ko" TEXT NOT NULL DEFAULT '[]',
    "error" TEXT,
    "finished_at" TEXT,
    CHECK ("status" IN ('pending', 'done', 'partial', 'failed')),
    PRIMARY KEY ("id"),
    UNIQUE ("export_id", "user_id"),
    FOREIGN KEY ("export_id") REFERENCES "data_export_runs" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."device_events" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "device_id" BLOB NOT NULL,
    "occurred_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "kind" TEXT NOT NULL,
    "ip_address" TEXT,
    "country" TEXT,
    "actor_id" BLOB,
    "actor_label" TEXT,
    "detail" TEXT,
    FOREIGN KEY ("actor_id") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("device_id") REFERENCES "devices" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."devices" (
    "id" BLOB NOT NULL,
    "user_id" BLOB NOT NULL,
    "correlation_hash" TEXT NOT NULL,
    "correlation_kind" TEXT NOT NULL DEFAULT 'key',
    "label" TEXT,
    "device_type" TEXT NOT NULL DEFAULT 'unknown',
    "client_kind" TEXT,
    "platform" TEXT,
    "platform_version" TEXT,
    "browser" TEXT,
    "browser_version" TEXT,
    "user_agent" TEXT,
    "signal_level" TEXT NOT NULL DEFAULT 'observed',
    "disk_encrypted" INTEGER,
    "screen_lock" INTEGER,
    "declared_platform" TEXT,
    "declared_version" TEXT,
    "declared_app_version" TEXT,
    "declared_at" TEXT,
    "first_seen_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_seen_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_ip" TEXT,
    "last_country" TEXT,
    "approval" TEXT NOT NULL DEFAULT 'pending',
    "approval_by" BLOB,
    "approval_label" TEXT,
    "approval_at" TEXT,
    "approval_reason" TEXT,
    CHECK ("approval" IN ('pending', 'approved', 'blocked')),
    CHECK ("correlation_kind" IN ('key', 'fingerprint')),
    CHECK ("device_type" IN ('desktop', 'mobile', 'tablet', 'tv', 'bot', 'api', 'unknown')),
    CHECK ("signal_level" IN ('observed', 'declared', 'attested')),
    PRIMARY KEY ("id"),
    UNIQUE ("user_id", "correlation_hash"),
    FOREIGN KEY ("approval_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."domains" (
    "id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "parent_id" BLOB,
    "verify_token" TEXT NOT NULL,
    "verified_at" TEXT,
    "last_checked_at" TEXT,
    "last_error" TEXT,
    "mx_hosts" TEXT NOT NULL DEFAULT '[]',
    "has_spf" INTEGER,
    "has_dmarc" INTEGER,
    "mail_checked_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    CHECK ("kind" IN ('primary', 'secondary', 'alias')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("parent_id") REFERENCES "domains" ("id") ON DELETE RESTRICT
);
CREATE TABLE "core"."event_log" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "event_type" TEXT NOT NULL,
    "source_module" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "depth" INTEGER NOT NULL DEFAULT 0,
    "cause_rule_id" BLOB
);
CREATE TABLE "core"."health_check_mutes" (
    "check_id" TEXT NOT NULL,
    "muted_by" BLOB,
    "muted_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "reason" TEXT,
    PRIMARY KEY ("check_id"),
    FOREIGN KEY ("muted_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."holiday_calendars" (
    "id" BLOB NOT NULL,
    "code" TEXT NOT NULL,
    "country_code" TEXT,
    "subdivision" TEXT,
    "parent_id" BLOB,
    "name" TEXT NOT NULL,
    "names" TEXT NOT NULL DEFAULT '{}',
    "is_builtin" INTEGER NOT NULL DEFAULT 0,
    "is_overridden" INTEGER NOT NULL DEFAULT 0,
    "enabled" INTEGER NOT NULL DEFAULT 1,
    "coverage_from" INTEGER,
    "coverage_to" INTEGER,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    PRIMARY KEY ("id"),
    UNIQUE ("code"),
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("parent_id") REFERENCES "holiday_calendars" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."holiday_exclusions" (
    "calendar_id" BLOB NOT NULL,
    "key" TEXT NOT NULL,
    PRIMARY KEY ("calendar_id", "key"),
    FOREIGN KEY ("calendar_id") REFERENCES "holiday_calendars" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."holiday_unit_prefs" (
    "id" BLOB NOT NULL,
    "org_unit_id" BLOB NOT NULL,
    "calendar_id" BLOB,
    "holiday_id" BLOB,
    "enabled" INTEGER NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("calendar_id") REFERENCES "holiday_calendars" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("holiday_id") REFERENCES "holidays" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("org_unit_id") REFERENCES "org_units" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."holidays" (
    "id" BLOB NOT NULL,
    "calendar_id" BLOB NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "names" TEXT NOT NULL DEFAULT '{}',
    "category" TEXT NOT NULL DEFAULT 'public',
    "kind" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "observance" TEXT NOT NULL DEFAULT 'none',
    "from_year" INTEGER,
    "to_year" INTEGER,
    "color" TEXT,
    "enabled" INTEGER NOT NULL DEFAULT 1,
    "is_builtin" INTEGER NOT NULL DEFAULT 0,
    "is_overridden" INTEGER NOT NULL DEFAULT 0,
    "is_orphan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    CHECK ("category" IN ('public', 'bank', 'government', 'school', 'optional', 'half_day', 'armed_forces', 'workday', 'observance')),
    CHECK ("kind" IN ('fixed', 'easter', 'nth_weekday', 'dates')),
    CHECK ("observance" IN ('none', 'next_workday', 'nearest_workday', 'sunday_to_monday', 'saturday_to_monday', 'saturday_to_friday')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("calendar_id") REFERENCES "holiday_calendars" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."idempotency_keys" (
    "id_hash" TEXT NOT NULL,
    "actor_hash" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "content_type" TEXT,
    "body" BLOB NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "expires_at" TEXT NOT NULL,
    PRIMARY KEY ("id_hash")
);
CREATE TABLE "core"."instance_identity" (
    "only_row" INTEGER NOT NULL DEFAULT 1,
    "instance_id" BLOB NOT NULL,
    "installed_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("only_row")
);
CREATE TABLE "core"."jobs" (
    "id" BLOB NOT NULL,
    "job_type" TEXT NOT NULL,
    "module_id" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "run_after" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "started_at" TEXT,
    "done_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    CHECK ("status" IN ('pending', 'running', 'done', 'failed')),
    PRIMARY KEY ("id")
);
CREATE TABLE "core"."label_links" (
    "id" BLOB NOT NULL,
    "label_id" BLOB NOT NULL,
    "owner_id" BLOB NOT NULL,
    "module" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "title" TEXT,
    "href" TEXT,
    "envelope" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("id"),
    UNIQUE ("label_id", "resource_type", "resource_id"),
    FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."label_shares" (
    "id" BLOB NOT NULL,
    "label_id" BLOB NOT NULL,
    "user_id" BLOB,
    "group_id" BLOB,
    "can_manage" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("group_id") REFERENCES "user_groups" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."labels" (
    "id" BLOB NOT NULL,
    "owner_id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1a73e8',
    "description" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("id"),
    UNIQUE ("owner_id", "name"),
    FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."ldap_directories" (
    "id" BLOB NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "enabled" INTEGER NOT NULL DEFAULT 0,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 389,
    "security" TEXT NOT NULL DEFAULT 'starttls',
    "verify_certificate" INTEGER NOT NULL DEFAULT 1,
    "ca_certificate" TEXT NOT NULL DEFAULT '',
    "connect_timeout_s" INTEGER NOT NULL DEFAULT 10,
    "bind_dn" TEXT NOT NULL DEFAULT '',
    "bind_password_enc" TEXT NOT NULL DEFAULT '',
    "base_dn" TEXT NOT NULL,
    "user_filter" TEXT NOT NULL DEFAULT '(&(objectClass=inetOrgPerson)(uid={login}))',
    "user_scope" TEXT NOT NULL DEFAULT 'subtree',
    "attr_username" TEXT NOT NULL DEFAULT 'uid',
    "attr_email" TEXT NOT NULL DEFAULT 'mail',
    "attr_display_name" TEXT NOT NULL DEFAULT 'cn',
    "attr_unique_id" TEXT NOT NULL DEFAULT 'entryUUID',
    "attr_member_of" TEXT NOT NULL DEFAULT '',
    "sync_groups" INTEGER NOT NULL DEFAULT 0,
    "group_base_dn" TEXT NOT NULL DEFAULT '',
    "group_filter" TEXT NOT NULL DEFAULT '(objectClass=groupOfNames)',
    "attr_group_name" TEXT NOT NULL DEFAULT 'cn',
    "attr_group_member" TEXT NOT NULL DEFAULT 'member',
    "sync_enabled" INTEGER NOT NULL DEFAULT 0,
    "sync_interval_min" INTEGER NOT NULL DEFAULT 60,
    "on_missing" TEXT NOT NULL DEFAULT 'disable',
    "allow_signup" INTEGER NOT NULL DEFAULT 1,
    "last_sync_at" TEXT,
    "last_sync_status" TEXT,
    "last_sync_detail" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "default_org_unit_id" BLOB,
    CHECK ("last_sync_status" IN ('ok', 'partial', 'failed')),
    CHECK ("on_missing" IN ('disable', 'ignore')),
    CHECK ("security" IN ('none', 'starttls', 'ldaps')),
    CHECK ("user_scope" IN ('base', 'onelevel', 'subtree')),
    PRIMARY KEY ("id"),
    UNIQUE ("slug"),
    FOREIGN KEY ("default_org_unit_id") REFERENCES "org_units" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."login_captcha_gate" (
    "identifier_hash" TEXT NOT NULL,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "window_started_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("identifier_hash")
);
CREATE TABLE "core"."login_throttle" (
    "user_id" BLOB NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "window_started_at" TEXT,
    "window_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TEXT,
    "locked_until" TEXT,
    "lockout_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("user_id"),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."migration_accounts" (
    "id" BLOB NOT NULL,
    "campaign_id" BLOB NOT NULL,
    "source_login" TEXT NOT NULL,
    "secret_enc" TEXT NOT NULL,
    "target_user_id" BLOB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "items_copied" INTEGER NOT NULL DEFAULT 0,
    "items_total" INTEGER NOT NULL DEFAULT 0,
    "cursor" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "started_at" TEXT,
    "finished_at" TEXT,
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    CHECK ("status" IN ('pending', 'running', 'done', 'failed', 'cancelled')),
    PRIMARY KEY ("id"),
    UNIQUE ("campaign_id", "source_login"),
    FOREIGN KEY ("campaign_id") REFERENCES "migration_campaigns" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("target_user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."migration_campaigns" (
    "id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "source_kind" TEXT NOT NULL,
    "source_host" TEXT NOT NULL,
    "source_port" INTEGER NOT NULL,
    "source_security" TEXT NOT NULL,
    "since_date" TEXT,
    "exclude_folders" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_by" BLOB,
    "actor_label" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "started_at" TEXT,
    "finished_at" TEXT,
    "error" TEXT,
    CHECK ("source_security" IN ('ssl', 'starttls', 'none')),
    CHECK ("status" IN ('draft', 'running', 'paused', 'done', 'failed')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."module_instances" (
    "id" BLOB NOT NULL,
    "module_id" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "routes" TEXT NOT NULL DEFAULT '[]',
    "sidebar_items" TEXT NOT NULL DEFAULT '[]',
    "subscribed_events" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'starting',
    "last_heartbeat" TEXT,
    "pid" INTEGER,
    "registered_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "mcp_tools" TEXT NOT NULL DEFAULT '[]',
    CHECK ("status" IN ('starting', 'healthy', 'degraded', 'stopped')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("module_id") REFERENCES "modules" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."module_integrity" (
    "module_id" TEXT NOT NULL,
    "last_sha256" TEXT NOT NULL,
    "first_seen_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_seen_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "signed" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("module_id")
);
CREATE TABLE "core"."module_usage_daily" (
    "day" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "user_id" BLOB NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("day", "module_id", "user_id"),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."modules" (
    "id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "license" TEXT,
    "homepage_url" TEXT,
    "runtime" TEXT NOT NULL DEFAULT 'rust',
    "dependencies" TEXT NOT NULL DEFAULT '[]',
    "is_enabled" INTEGER NOT NULL DEFAULT 1,
    "is_core_module" INTEGER NOT NULL DEFAULT 0,
    "config" TEXT NOT NULL DEFAULT '{}',
    "installed_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "cli_commands" TEXT NOT NULL DEFAULT '[]',
    CHECK ("runtime" IN ('rust', 'python', 'node', 'binary')),
    PRIMARY KEY ("id")
);
CREATE TABLE "core"."oauth_providers" (
    "id" BLOB NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "issuer_url" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret_enc" TEXT NOT NULL DEFAULT '',
    "scopes" TEXT NOT NULL DEFAULT 'openid email profile',
    "button_color" TEXT,
    "enabled" INTEGER NOT NULL DEFAULT 1,
    "allow_signup" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "claim_username" TEXT NOT NULL DEFAULT 'preferred_username',
    "claim_email" TEXT NOT NULL DEFAULT 'email',
    "claim_display_name" TEXT NOT NULL DEFAULT 'name',
    "claim_groups" TEXT NOT NULL DEFAULT 'groups',
    "sync_groups" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("id"),
    UNIQUE ("slug")
);
CREATE TABLE "core"."org_units" (
    "id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" BLOB,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "description" TEXT,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("parent_id") REFERENCES "org_units" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."password_history" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "user_id" BLOB NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."privileges" (
    "key" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verb" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_ou_scopable" INTEGER NOT NULL DEFAULT 0,
    "is_orphan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "is_token_grantable" INTEGER NOT NULL DEFAULT 1,
    CHECK ("verb" IN ('read', 'create', 'update', 'delete', 'manage', 'execute')),
    PRIMARY KEY ("key")
);
CREATE TABLE "core"."push_devices" (
    "id" BLOB NOT NULL,
    "user_id" BLOB NOT NULL,
    "provider" TEXT NOT NULL,
    "device_token" TEXT NOT NULL,
    "app_id" TEXT,
    "locale" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_seen_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    CHECK ("provider" IN ('apns', 'fcm', 'unifiedpush')),
    PRIMARY KEY ("id"),
    UNIQUE ("provider", "device_token"),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."push_preferences" (
    "user_id" BLOB NOT NULL,
    "module_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "enabled" INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY ("user_id", "module_id", "event_type"),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."rate_limit_windows" (
    "key" TEXT NOT NULL,
    "window_start" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY ("key", "window_start")
);
CREATE TABLE "core"."reauth_grants" (
    "id" BLOB NOT NULL,
    "user_id" BLOB NOT NULL,
    "jti" BLOB NOT NULL,
    "method" TEXT NOT NULL,
    "granted_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "expires_at" TEXT NOT NULL,
    "grace_until" TEXT NOT NULL,
    "ip_address" TEXT,
    CHECK ("method" IN ('password', 'totp', 'backup_code')),
    PRIMARY KEY ("id"),
    UNIQUE ("jti"),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."refresh_tokens" (
    "id" BLOB NOT NULL,
    "user_id" BLOB NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_name" TEXT,
    "device_type" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_used_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "revoked_at" TEXT,
    "revoke_reason" TEXT,
    "family_id" BLOB,
    "client_type" TEXT,
    "rotated_to" BLOB,
    "device_id" BLOB,
    "country" TEXT,
    "auth_strength" TEXT,
    PRIMARY KEY ("id"),
    UNIQUE ("token_hash"),
    FOREIGN KEY ("device_id") REFERENCES "devices" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."remote_mounts" (
    "id" BLOB NOT NULL,
    "owner_id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config_enc" BLOB NOT NULL,
    "mount_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "last_connected_at" TEXT,
    "last_error" TEXT,
    "remote_quota_bytes" INTEGER,
    "remote_used_bytes" INTEGER,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    CHECK ("provider" IN ('webdav', 'nextcloud', 'owncloud', 'sftp', 'ftp', 'smb', 'nfs', 'gdrive', 'dropbox', 's3')),
    CHECK ("status" IN ('connected', 'disconnected', 'error', 'syncing')),
    PRIMARY KEY ("id"),
    UNIQUE ("owner_id", "mount_name"),
    FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."resource_feature_links" (
    "resource_id" BLOB NOT NULL,
    "feature_id" BLOB NOT NULL,
    PRIMARY KEY ("resource_id", "feature_id"),
    FOREIGN KEY ("feature_id") REFERENCES "resource_features" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("resource_id") REFERENCES "resources" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."resource_features" (
    "id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."resources" (
    "id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "building_id" BLOB NOT NULL,
    "category" TEXT NOT NULL,
    "resource_type" TEXT,
    "floor_name" TEXT NOT NULL,
    "floor_section" TEXT,
    "capacity" INTEGER NOT NULL,
    "user_description" TEXT,
    "description" TEXT,
    "generated_name" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    "release_exempt" INTEGER NOT NULL DEFAULT 0,
    CHECK ("category" IN ('meeting_room', 'other')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("building_id") REFERENCES "buildings" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("building_id", "floor_name") REFERENCES "building_floors" ("building_id", "name")
);
CREATE TABLE "core"."role_assignments" (
    "id" BLOB NOT NULL,
    "role_id" BLOB NOT NULL,
    "subject_user_id" BLOB,
    "subject_group_id" BLOB,
    "scope" TEXT NOT NULL,
    "scope_org_unit_id" BLOB,
    "expires_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    CHECK ("scope" IN ('instance', 'org_unit')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("scope_org_unit_id") REFERENCES "org_units" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("subject_group_id") REFERENCES "user_groups" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("subject_user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."role_privileges" (
    "role_id" BLOB NOT NULL,
    "privilege_key" TEXT NOT NULL,
    PRIMARY KEY ("role_id", "privilege_key"),
    FOREIGN KEY ("privilege_key") REFERENCES "privileges" ("key") ON DELETE RESTRICT,
    FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."roles" (
    "id" BLOB NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" INTEGER NOT NULL DEFAULT 0,
    "is_superuser" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("id"),
    UNIQUE ("slug")
);
CREATE TABLE "core"."rule_actions" (
    "key" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "endpoint" TEXT,
    "params_schema" TEXT NOT NULL DEFAULT '[]',
    "is_blocking" INTEGER NOT NULL DEFAULT 0,
    "is_reversible" INTEGER NOT NULL DEFAULT 0,
    "is_orphan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("key")
);
CREATE TABLE "core"."rule_backtests" (
    "id" BLOB NOT NULL,
    "rule_id" BLOB NOT NULL,
    "rule_version" INTEGER NOT NULL,
    "window_from" TEXT NOT NULL,
    "window_to" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "report" TEXT NOT NULL DEFAULT '{}',
    "error" TEXT,
    "requested_by" BLOB,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "completed_at" TEXT,
    CHECK ("status" IN ('pending', 'running', 'done', 'failed')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("requested_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("rule_id") REFERENCES "rules" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."rule_executions" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "rule_id" BLOB NOT NULL,
    "rule_version" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_user_id" BLOB,
    "org_unit_id" BLOB,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "detail" TEXT NOT NULL DEFAULT '{}',
    "actions_total" INTEGER NOT NULL DEFAULT 0,
    "actions_ok" INTEGER NOT NULL DEFAULT 0,
    "actions_failed" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "occurred_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "gate_reference" TEXT,
    CHECK ("mode" IN ('simulate', 'monitor', 'enforce', 'backtest')),
    CHECK ("outcome" IN ('matched', 'acted', 'no_match', 'out_of_scope', 'out_of_rollout', 'below_threshold', 'depth_exceeded', 'error')),
    FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("org_unit_id") REFERENCES "org_units" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("rule_id") REFERENCES "rules" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."rule_hits" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "rule_id" BLOB NOT NULL,
    "subject_key" TEXT NOT NULL,
    "occurred_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    FOREIGN KEY ("rule_id") REFERENCES "rules" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."rule_triggers" (
    "key" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "fields" TEXT NOT NULL DEFAULT '[]',
    "is_orphan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("key")
);
CREATE TABLE "core"."rule_versions" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "rule_id" BLOB NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "change_note" TEXT,
    "changed_by" BLOB,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    UNIQUE ("rule_id", "version"),
    FOREIGN KEY ("changed_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("rule_id") REFERENCES "rules" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."rules" (
    "id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger_key" TEXT NOT NULL,
    "conditions" TEXT NOT NULL DEFAULT '{"of": [], "type": "all"}',
    "actions" TEXT NOT NULL DEFAULT '[]',
    "mode" TEXT NOT NULL DEFAULT 'inactive',
    "scope" TEXT NOT NULL DEFAULT '{"exclude": [], "include": []}',
    "threshold_count" INTEGER,
    "threshold_window_s" INTEGER,
    "rollout_percent" INTEGER NOT NULL DEFAULT 100,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    "updated_by" BLOB,
    CHECK ("mode" IN ('inactive', 'simulate', 'monitor', 'enforce')),
    CHECK ("severity" IN ('critical', 'warning', 'info')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("trigger_key") REFERENCES "rule_triggers" ("key") ON DELETE RESTRICT,
    FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."setting_values" (
    "key" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" BLOB NOT NULL DEFAULT x'00000000000000000000000000000000',
    "value" TEXT NOT NULL,
    "locked" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_by" BLOB,
    CHECK ("scope_type" IN ('instance', 'org_unit', 'group', 'user')),
    PRIMARY KEY ("key", "scope_type", "scope_id"),
    FOREIGN KEY ("key") REFERENCES "settings" ("key") ON DELETE CASCADE,
    FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT,
    "description" TEXT,
    "is_public" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_by" BLOB,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "value_type" TEXT,
    "allowed_values" TEXT,
    "module_id" TEXT,
    "default_value" TEXT,
    CHECK ("scope" IN ('global', 'user', 'overridable')),
    PRIMARY KEY ("key"),
    FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."storage_reporters" (
    "module_id" TEXT NOT NULL,
    "first_declared_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_declared_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_full_sync_at" TEXT,
    "declarations" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("module_id"),
    FOREIGN KEY ("module_id") REFERENCES "modules" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."storage_samples" (
    "day" TEXT NOT NULL,
    "used_bytes" INTEGER NOT NULL,
    "quota_bytes" INTEGER NOT NULL,
    "accounts" INTEGER NOT NULL,
    "over_quota" INTEGER NOT NULL DEFAULT 0,
    "captured_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("day")
);
CREATE TABLE "core"."storage_usage" (
    "module_id" TEXT NOT NULL,
    "user_id" BLOB NOT NULL,
    "used_bytes" INTEGER NOT NULL,
    "object_count" INTEGER,
    "declared_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "category" TEXT NOT NULL DEFAULT 'content',
    CHECK ("category" IN ('content', 'trash', 'versions', 'retention', 'thumbnails', 'index', 'cache', 'staging', 'system', 'delegated')),
    PRIMARY KEY ("module_id", "user_id", "category"),
    FOREIGN KEY ("module_id") REFERENCES "modules" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."support_contract" (
    "only_row" INTEGER NOT NULL DEFAULT 1,
    "key_text" TEXT NOT NULL,
    "verified" INTEGER NOT NULL DEFAULT 0,
    "key_id" TEXT,
    "subject" TEXT NOT NULL,
    "plan" TEXT,
    "perimeter" TEXT,
    "contact" TEXT,
    "issued_at" TEXT,
    "expires_at" TEXT,
    "registered_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "registered_by" BLOB,
    PRIMARY KEY ("only_row"),
    FOREIGN KEY ("registered_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."target_audience_members" (
    "audience_id" BLOB NOT NULL,
    "member_type" TEXT NOT NULL,
    "member_id" BLOB NOT NULL,
    "added_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "added_by" BLOB,
    CHECK ("member_type" IN ('user', 'group')),
    PRIMARY KEY ("audience_id", "member_type", "member_id"),
    FOREIGN KEY ("added_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("audience_id") REFERENCES "target_audiences" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."target_audience_policies" (
    "org_unit_id" BLOB NOT NULL,
    "module_id" TEXT NOT NULL,
    "audience_id" BLOB NOT NULL,
    "position" INTEGER NOT NULL,
    PRIMARY KEY ("org_unit_id", "module_id", "audience_id"),
    FOREIGN KEY ("audience_id") REFERENCES "target_audiences" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("org_unit_id") REFERENCES "org_units" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."target_audiences" (
    "id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_everyone" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "created_by" BLOB,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."tls_certificates" (
    "id" BLOB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'upload',
    "subject" TEXT,
    "issuer" TEXT,
    "san" TEXT NOT NULL DEFAULT '[]',
    "not_before" TEXT,
    "not_after" TEXT,
    "is_active" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by" BLOB,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    CHECK ("source" IN ('upload', 'acme')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."totp_backup_codes" (
    "id" BLOB NOT NULL,
    "user_id" BLOB NOT NULL,
    "code_hash" TEXT NOT NULL,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "used_at" TEXT,
    "used_ip" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."user_group_members" (
    "group_id" BLOB NOT NULL,
    "user_id" BLOB NOT NULL,
    "added_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "added_by" BLOB,
    "source" TEXT NOT NULL DEFAULT 'manual',
    CHECK ("source" IN ('manual', 'directory')),
    PRIMARY KEY ("group_id", "user_id"),
    FOREIGN KEY ("added_by") REFERENCES "users" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("group_id") REFERENCES "user_groups" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE "core"."user_groups" (
    "id" BLOB NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "is_default" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "is_system" INTEGER NOT NULL DEFAULT 0,
    "ldap_directory_id" BLOB,
    "ldap_dn" TEXT,
    "oauth_provider_slug" TEXT,
    "release_exempt" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("id"),
    UNIQUE ("name"),
    FOREIGN KEY ("ldap_directory_id") REFERENCES "ldap_directories" ("id") ON DELETE SET NULL
);
CREATE TABLE "core"."users" (
    "id" BLOB NOT NULL,
    "email" TEXT COLLATE NOCASE NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "quota_bytes" INTEGER NOT NULL DEFAULT 10737418240,
    "used_bytes" INTEGER NOT NULL DEFAULT 0,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "email_verified" INTEGER NOT NULL DEFAULT 0,
    "oauth_provider" TEXT,
    "oauth_id" TEXT,
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "updated_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    "last_login_at" TEXT,
    "totp_enabled" INTEGER NOT NULL DEFAULT 0,
    "totp_secret" TEXT,
    "totp_pending_secret" TEXT,
    "org_unit_id" BLOB NOT NULL,
    "must_change_password" INTEGER NOT NULL DEFAULT 0,
    "admin_2fa_grace_until" TEXT,
    "ldap_directory_id" BLOB,
    "ldap_dn" TEXT,
    "ldap_uid" TEXT,
    "ldap_synced_at" TEXT,
    "deleted_at" TEXT,
    "name_pronunciation" TEXT,
    "pronouns" TEXT,
    "work_location" TEXT,
    "introduction" TEXT,
    "gender" TEXT,
    "birthday" TEXT,
    "password_changed_at" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    CHECK ("role" IN ('user', 'admin', 'guest')),
    PRIMARY KEY ("id"),
    UNIQUE ("oauth_provider", "oauth_id"),
    UNIQUE ("email"),
    UNIQUE ("username"),
    FOREIGN KEY ("ldap_directory_id") REFERENCES "ldap_directories" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("org_unit_id") REFERENCES "org_units" ("id")
);
CREATE TABLE "core"."verification_tokens" (
    "id" BLOB NOT NULL,
    "user_id" BLOB NOT NULL,
    "token_hash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "used_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    CHECK ("purpose" IN ('email_verify', 'password_reset', 'invite')),
    PRIMARY KEY ("id"),
    UNIQUE ("token_hash"),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE INDEX "core"."idx_core_alert_events_alert" ON "alert_events" ("alert_id", "occurred_at", "id");
CREATE INDEX "core"."idx_core_alert_views_owner" ON "alert_views" ("owner_id", "name");
CREATE INDEX "core"."idx_core_alerts_assignee" ON "alerts" ("assignee_id");
CREATE INDEX "core"."idx_core_alerts_created" ON "alerts" ("created_at");
CREATE INDEX "core"."idx_core_alerts_kind" ON "alerts" ("kind", "last_seen_at");
CREATE INDEX "core"."idx_core_alerts_open" ON "alerts" ("severity", "last_seen_at");
CREATE INDEX "core"."idx_core_alerts_seen" ON "alerts" ("last_seen_at", "id");
CREATE INDEX "core"."idx_core_alerts_simulation" ON "alerts" ("is_simulation");
CREATE INDEX "core"."idx_core_alerts_subject" ON "alerts" ("subject_user_id");
CREATE INDEX "core"."idx_core_api_tokens_hash" ON "api_tokens" ("token_hash");
CREATE INDEX "core"."idx_core_api_tokens_legacy" ON "api_tokens" ("is_legacy");
CREATE INDEX "core"."idx_core_api_tokens_scopes" ON "api_tokens" ("scopes");
CREATE INDEX "core"."idx_core_api_tokens_user" ON "api_tokens" ("user_id");
CREATE INDEX "core"."idx_core_assign_group" ON "role_assignments" ("subject_group_id");
CREATE INDEX "core"."idx_core_assign_role" ON "role_assignments" ("role_id");
CREATE INDEX "core"."idx_core_assign_unit" ON "role_assignments" ("scope_org_unit_id");
CREATE INDEX "core"."idx_core_assign_user" ON "role_assignments" ("subject_user_id");
CREATE INDEX "core"."idx_core_audit_action" ON "admin_audit" ("action", "occurred_at");
CREATE INDEX "core"."idx_core_audit_actor" ON "admin_audit" ("actor_id", "occurred_at");
CREATE INDEX "core"."idx_core_audit_denied" ON "admin_audit" ("occurred_at");
CREATE INDEX "core"."idx_core_audit_occurred" ON "admin_audit" ("occurred_at", "id");
CREATE INDEX "core"."idx_core_audit_target" ON "admin_audit" ("target_type", "target_id", "occurred_at");
CREATE INDEX "core"."idx_core_backup_runs_started" ON "backup_runs" ("started_at");
CREATE INDEX "core"."idx_core_backup_runs_success" ON "backup_runs" ("finished_at");
CREATE INDEX "core"."idx_core_captcha_expires" ON "captcha_challenges" ("expires_at");
CREATE INDEX "core"."idx_core_clipboard_owner_recent" ON "clipboard_items" ("owner_id", "created_at");
CREATE INDEX "core"."idx_core_collab_updates_room" ON "collab_updates" ("room", "created_at");
CREATE INDEX "core"."idx_core_data_export_active" ON "data_export_runs" ("requested_at");
CREATE INDEX "core"."idx_core_data_export_expiring" ON "data_export_runs" ("expires_at");
CREATE INDEX "core"."idx_core_data_export_requested" ON "data_export_runs" ("requested_at");
CREATE INDEX "core"."idx_core_data_export_self" ON "data_export_runs" ("requested_by", "requested_at");
CREATE INDEX "core"."idx_core_data_export_subjects_pending" ON "data_export_subjects" ("export_id");
CREATE INDEX "core"."idx_core_data_export_subjects_user" ON "data_export_subjects" ("user_id");
CREATE INDEX "core"."idx_core_detectors_enabled" ON "content_detectors" ("is_enabled");
CREATE INDEX "core"."idx_core_device_events_device" ON "device_events" ("device_id", "occurred_at");
CREATE INDEX "core"."idx_core_device_events_kind_time" ON "device_events" ("kind", "occurred_at");
CREATE INDEX "core"."idx_core_devices_approval" ON "devices" ("approval");
CREATE INDEX "core"."idx_core_devices_country" ON "devices" ("last_country");
CREATE INDEX "core"."idx_core_devices_last_seen" ON "devices" ("last_seen_at");
CREATE INDEX "core"."idx_core_devices_platform" ON "devices" ("platform");
CREATE INDEX "core"."idx_core_devices_user" ON "devices" ("user_id");
CREATE UNIQUE INDEX "core"."idx_core_domains_name" ON "domains" ("name");
CREATE INDEX "core"."idx_core_domains_parent" ON "domains" ("parent_id");
CREATE INDEX "core"."idx_core_el_created" ON "event_log" ("created_at");
CREATE INDEX "core"."idx_core_el_type" ON "event_log" ("event_type");
CREATE INDEX "core"."idx_core_el_type_created" ON "event_log" ("event_type", "created_at");
CREATE INDEX "core"."idx_core_holiday_calendars_country" ON "holiday_calendars" ("country_code");
CREATE INDEX "core"."idx_core_holiday_calendars_parent" ON "holiday_calendars" ("parent_id");
CREATE INDEX "core"."idx_core_holidays_calendar" ON "holidays" ("calendar_id");
CREATE UNIQUE INDEX "core"."idx_core_holidays_key" ON "holidays" ("calendar_id", "key");
CREATE INDEX "core"."idx_core_idem_expires" ON "idempotency_keys" ("expires_at");
CREATE INDEX "core"."idx_core_jobs_claim" ON "jobs" ("job_type", "run_after");
CREATE INDEX "core"."idx_core_jobs_pending" ON "jobs" ("run_after");
CREATE INDEX "core"."idx_core_jobs_running" ON "jobs" ("started_at");
CREATE INDEX "core"."idx_core_label_links_label" ON "label_links" ("label_id");
CREATE INDEX "core"."idx_core_label_links_owner" ON "label_links" ("owner_id");
CREATE INDEX "core"."idx_core_label_links_resource" ON "label_links" ("resource_type", "resource_id");
CREATE INDEX "core"."idx_core_label_links_title_trgm" ON "label_links" ("title");
CREATE INDEX "core"."idx_core_label_shares_label" ON "label_shares" ("label_id");
CREATE INDEX "core"."idx_core_label_shares_subject" ON "label_shares" ("user_id", "group_id");
CREATE INDEX "core"."idx_core_labels_owner" ON "labels" ("owner_id");
CREATE INDEX "core"."idx_core_ldap_enabled" ON "ldap_directories" ("enabled");
CREATE INDEX "core"."idx_core_login_captcha_gate_stale" ON "login_captcha_gate" ("updated_at");
CREATE INDEX "core"."idx_core_login_throttle_locked" ON "login_throttle" ("locked_until");
CREATE INDEX "core"."idx_core_mi_module" ON "module_instances" ("module_id");
CREATE INDEX "core"."idx_core_mi_status" ON "module_instances" ("status");
CREATE INDEX "core"."idx_core_module_usage_day" ON "module_usage_daily" ("day");
CREATE INDEX "core"."idx_core_ou_parent" ON "org_units" ("parent_id");
CREATE INDEX "core"."idx_core_priv_namespace" ON "privileges" ("namespace");
CREATE INDEX "core"."idx_core_priv_scopable" ON "privileges" ("is_ou_scopable");
CREATE INDEX "core"."idx_core_push_user" ON "push_devices" ("user_id");
CREATE INDEX "core"."idx_core_reauth_jti" ON "reauth_grants" ("jti");
CREATE INDEX "core"."idx_core_reauth_user" ON "reauth_grants" ("user_id", "grace_until");
CREATE INDEX "core"."idx_core_resources_building" ON "resources" ("building_id");
CREATE INDEX "core"."idx_core_resources_category" ON "resources" ("category");
CREATE INDEX "core"."idx_core_rfl_feature" ON "resource_feature_links" ("feature_id");
CREATE INDEX "core"."idx_core_rl_key" ON "rate_limit_windows" ("key", "window_start");
CREATE INDEX "core"."idx_core_rm_owner" ON "remote_mounts" ("owner_id");
CREATE INDEX "core"."idx_core_rm_status" ON "remote_mounts" ("status");
CREATE INDEX "core"."idx_core_role_priv_key" ON "role_privileges" ("privilege_key");
CREATE INDEX "core"."idx_core_rt_active" ON "refresh_tokens" ("last_used_at");
CREATE INDEX "core"."idx_core_rt_device" ON "refresh_tokens" ("device_id");
CREATE INDEX "core"."idx_core_rt_expires" ON "refresh_tokens" ("expires_at");
CREATE INDEX "core"."idx_core_rt_family" ON "refresh_tokens" ("family_id");
CREATE INDEX "core"."idx_core_rt_hash" ON "refresh_tokens" ("token_hash");
CREATE INDEX "core"."idx_core_rt_user" ON "refresh_tokens" ("user_id");
CREATE INDEX "core"."idx_core_rule_actions_module" ON "rule_actions" ("module_id");
CREATE INDEX "core"."idx_core_rule_backtests_rule" ON "rule_backtests" ("rule_id", "created_at");
CREATE INDEX "core"."idx_core_rule_exec_gate_ref" ON "rule_executions" ("gate_reference");
CREATE INDEX "core"."idx_core_rule_exec_outcome" ON "rule_executions" ("outcome", "occurred_at");
CREATE INDEX "core"."idx_core_rule_exec_rule" ON "rule_executions" ("rule_id", "occurred_at");
CREATE INDEX "core"."idx_core_rule_exec_time" ON "rule_executions" ("occurred_at");
CREATE INDEX "core"."idx_core_rule_hits_window" ON "rule_hits" ("rule_id", "subject_key", "occurred_at");
CREATE INDEX "core"."idx_core_rule_triggers_event" ON "rule_triggers" ("event_type");
CREATE INDEX "core"."idx_core_rule_triggers_module" ON "rule_triggers" ("module_id");
CREATE INDEX "core"."idx_core_rule_versions_rule" ON "rule_versions" ("rule_id", "version");
CREATE INDEX "core"."idx_core_rules_active" ON "rules" ("mode");
CREATE INDEX "core"."idx_core_rules_trigger" ON "rules" ("trigger_key");
CREATE INDEX "core"."idx_core_settings_module" ON "settings" ("module_id");
CREATE INDEX "core"."idx_core_su_user" ON "storage_usage" ("user_id", "module_id");
CREATE INDEX "core"."idx_core_sv_locked" ON "setting_values" ("key");
CREATE INDEX "core"."idx_core_sv_scope" ON "setting_values" ("scope_type", "scope_id");
CREATE INDEX "core"."idx_core_tam_member" ON "target_audience_members" ("member_type", "member_id");
CREATE INDEX "core"."idx_core_tap_audience" ON "target_audience_policies" ("audience_id");
CREATE INDEX "core"."idx_core_tbc_user" ON "totp_backup_codes" ("user_id");
CREATE INDEX "core"."idx_core_tbc_user_unused" ON "totp_backup_codes" ("user_id");
CREATE INDEX "core"."idx_core_tls_not_after" ON "tls_certificates" ("not_after");
CREATE INDEX "core"."idx_core_ugm_group" ON "user_group_members" ("group_id");
CREATE INDEX "core"."idx_core_ugm_source" ON "user_group_members" ("source");
CREATE INDEX "core"."idx_core_ugm_user" ON "user_group_members" ("user_id");
CREATE INDEX "core"."idx_core_users_active" ON "users" ("is_active");
CREATE INDEX "core"."idx_core_users_deleted_at" ON "users" ("deleted_at");
CREATE INDEX "core"."idx_core_users_email" ON "users" ("email");
CREATE INDEX "core"."idx_core_users_ldap" ON "users" ("ldap_directory_id");
CREATE INDEX "core"."idx_core_users_ou" ON "users" ("org_unit_id");
CREATE INDEX "core"."idx_core_users_role" ON "users" ("role");
CREATE INDEX "core"."idx_core_vt_hash" ON "verification_tokens" ("token_hash");
CREATE INDEX "core"."idx_migration_accounts_campaign" ON "migration_accounts" ("campaign_id", "status");
CREATE INDEX "core"."idx_migration_accounts_claim" ON "migration_accounts" ("status", "updated_at");
CREATE INDEX "core"."idx_migration_accounts_target" ON "migration_accounts" ("target_user_id");
CREATE INDEX "core"."idx_migration_campaigns_created" ON "migration_campaigns" ("created_at");
CREATE INDEX "core"."idx_migration_campaigns_status" ON "migration_campaigns" ("status");
CREATE INDEX "core"."password_history_user_recent_idx" ON "password_history" ("user_id", "created_at");


-- ─────────────────────────────────────────────────────────────────────
-- Seed data: the FINAL catalog the PostgreSQL migrations reach, ported
-- verbatim (same rows, same keys, same cross-references). Timestamp
-- columns are omitted so each engine's own default stamps them.
-- instance_identity is NOT seeded here: its instance_id is random per
-- install and is written by the core in Rust after the migrations run.
-- ─────────────────────────────────────────────────────────────────────

-- settings (158 rows)
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('instance.name', '"Kubuno"', 'general', 'Nom de l''instance', NULL, 1, NULL, 'global', NULL, NULL, NULL, '"Kubuno"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('instance.description', '"Mon cloud personnel"', 'general', 'Description', NULL, 1, NULL, 'global', NULL, NULL, NULL, '"Mon cloud personnel"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('instance.logo_url', 'null', 'general', 'URL du logo personnalisé', NULL, 1, NULL, 'global', NULL, NULL, NULL, 'null');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('instance.color_primary', '"#1a73e8"', 'general', 'Couleur principale (hex)', NULL, 1, NULL, 'global', NULL, NULL, NULL, '"#1a73e8"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.email_verification', 'false', 'auth', 'Vérification email obligatoire', NULL, 0, NULL, 'global', NULL, NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.oauth_google_enabled', 'false', 'auth', 'Connexion Google activée', NULL, 1, NULL, 'global', NULL, NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.oauth_github_enabled', 'false', 'auth', 'Connexion GitHub activée', NULL, 1, NULL, 'global', NULL, NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.jwt_access_ttl_s', '900', 'security', 'Durée token accès (secondes)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '900');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.jwt_refresh_ttl_d', '30', 'security', 'Durée token refresh (jours)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '30');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.max_sessions', '10', 'security', 'Sessions simultanées max par user', NULL, 0, NULL, 'global', NULL, NULL, NULL, '10');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.registration_open', 'true', 'auth', 'Inscription publique activée', NULL, 1, NULL, 'global', NULL, NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('navigation.default_module', 'null', 'navigation', 'Module par défaut', 'Chemin du module affiché à la connexion (ex: "/files"). null = page d''accueil.', 1, NULL, 'global', NULL, NULL, NULL, 'null');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.api_token_allowed_roles', '["user","admin"]', 'auth', 'Rôles autorisés à créer des tokens d''API', 'Rôles pouvant générer des tokens d''API personnels depuis leur profil. Valeurs possibles : "user", "admin", "guest".', 1, NULL, 'global', NULL, NULL, NULL, '["user","admin"]');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('photos.thumbnail_size', '256', 'photos', 'Taille des miniatures (px)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '256');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('photos.jpeg_quality', '85', 'photos', 'Qualité JPEG des miniatures (0–100)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '85');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('photos.trash_auto_delete_days', '30', 'photos', 'Auto-suppression corbeille (jours, 0=jamais)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '30');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('photos.allow_public_sharing', 'true', 'photos', 'Partage public activé', NULL, 0, NULL, 'global', NULL, NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('photos.share_link_max_days', '30', 'photos', 'Durée max des liens de partage (jours)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '30');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('agenda.default_timezone', '"Europe/Paris"', 'agenda', 'Fuseau horaire par défaut', NULL, 0, NULL, 'global', NULL, NULL, NULL, '"Europe/Paris"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('agenda.week_starts_on', '"monday"', 'agenda', 'Premier jour de la semaine', NULL, 0, NULL, 'global', NULL, NULL, NULL, '"monday"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('storage.default_quota_bytes', '10737418240', 'storage', 'Quota par défaut d''un nouveau compte (octets)', 'Appliqué à la création d''un compte : inscription publique, création par un administrateur, première connexion SSO. Réglable par unité organisationnelle — une unité hérite de son parent tant qu''elle n''a pas sa propre valeur.', 0, NULL, 'global', 'int', NULL, NULL, '10737418240');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('agenda.time_format', '"24h"', 'agenda', 'Format d''heure (12h / 24h)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '"24h"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('agenda.default_event_duration_min', '60', 'agenda', 'Durée par défaut des événements (min)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '60');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('notes.default_editor', '"wysiwyg"', 'notes', 'Mode éditeur par défaut', NULL, 0, NULL, 'global', NULL, NULL, NULL, '"wysiwyg"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('notes.autosave_interval_s', '30', 'notes', 'Intervalle auto-save (secondes)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '30');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('notes.enable_spell_check', 'true', 'notes', 'Correcteur orthographique actif', NULL, 0, NULL, 'global', NULL, NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('notes.enable_bidirectional_links', 'true', 'notes', 'Liens bidirectionnels actifs', NULL, 0, NULL, 'global', NULL, NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('notes.default_reminder_before_min', '60', 'notes', 'Rappel par défaut avant échéance (min)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '60');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('office.default_format', '"docx"', 'office', 'Format de document par défaut', NULL, 0, NULL, 'global', NULL, NULL, NULL, '"docx"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('office.autosave_interval_s', '30', 'office', 'Intervalle auto-save (secondes)', NULL, 0, NULL, 'global', NULL, NULL, NULL, '30');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('office.track_changes_default', 'false', 'office', 'Mode révision activé par défaut', NULL, 0, NULL, 'global', NULL, NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('office.default_margins', '"normal"', 'office', 'Marges par défaut', NULL, 0, NULL, 'global', NULL, NULL, NULL, '"normal"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('appearance.theme', '"kubuno-light"', 'appearance', 'Thème de l''interface', 'Identifiant du thème actif (kubuno-light, kubuno-dark, ou thème personnalisé).', 1, NULL, 'global', NULL, NULL, NULL, '"kubuno-light"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mcp.enabled', 'false', 'mcp', 'Serveur MCP activé', 'Expose les outils des modules via le protocole MCP sur /mcp', 0, NULL, 'global', NULL, NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.ddos_enabled', 'true', 'security', 'Protection anti-DDoS activée', 'Active le rate-limit par IP et le load-shedding de concurrence. À laisser activé en production.', 0, NULL, 'global', NULL, NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.ddos_rate_per_min', '600', 'security', 'Requêtes max par IP et par minute', 'Au-delà, les requêtes de cette IP reçoivent 429 (minimum effectif : 60). /health et /ready sont exemptés.', 0, NULL, 'global', NULL, NULL, NULL, '600');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.ddos_max_concurrent', '1024', 'security', 'Requêtes simultanées maximum', 'Au-delà, le serveur renvoie 503 immédiatement (load-shedding) pour borner la mémoire (minimum effectif : 16). Les WebSocket sont exemptés.', 0, NULL, 'global', NULL, NULL, NULL, '1024');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.session_idle_timeout_min', '0', 'security', 'Déconnexion après inactivité (minutes)', 'Déconnexion automatique après inactivité, en minutes (0 = désactivé, défaut). La session reste bornée par la durée du refresh token.', 1, NULL, 'global', NULL, NULL, NULL, '0');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('appearance.trusted_themes', '[]', 'appearance', 'Thèmes autorisés à exécuter des scripts', 'Liste des identifiants de thèmes empaquetés dont le JavaScript est autorisé à s''exécuter dans le navigateur des utilisateurs. La CSS est toujours appliquée, indépendamment de cette liste.', 0, NULL, 'global', NULL, NULL, NULL, '[]');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('appearance.login_animation', '{"amp":0.75,"gain":4.7,"tilt":0.08,"shift":0.17,"sigma":0.004,"speed":3.55,"nonUniform":1.0}', 'appearance', 'Animation de la page de connexion', 'Paramètres du drapé animé (flou, luminosité, ondulations…) réglés depuis la console d''administration', 1, NULL, 'global', NULL, NULL, NULL, '{"amp":0.75,"gain":4.7,"tilt":0.08,"shift":0.17,"sigma":0.004,"speed":3.55,"nonUniform":1.0}');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.rate_user_per_min', '3000', 'security', 'Requêtes max par utilisateur authentifié et par minute', 'Budget propre d''un utilisateur (Bearer valide) quand la fenêtre IP est saturée : une IP partagée (foyer, bureau) ne s''auto-étrangle plus. Un flood anonyme reste borné par la limite IP (minimum effectif : 60).', 0, NULL, 'global', NULL, NULL, NULL, '3000');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.audit_retention_days', '400', 'security', 'Rétention du journal d''audit (jours)', 'Durée de conservation des entrées du journal d''administration. Plancher : 90 jours, non abaissable.', 0, NULL, 'global', NULL, NULL, NULL, '400');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('jobs.concurrency', '4', 'jobs', 'Tâches de fond en parallèle', 'Nombre de tâches exécutées simultanément par le serveur.', 0, NULL, 'global', NULL, NULL, NULL, '4');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('jobs.poll_interval_s', '5', 'jobs', 'Sondage de la file (secondes)', 'Filet de sécurité si une notification PostgreSQL est perdue.', 0, NULL, 'global', NULL, NULL, NULL, '5');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('jobs.stalled_after_s', '1800', 'jobs', 'Délai de reprise après incident (secondes)', 'Une tâche « en cours » depuis plus longtemps est considérée orpheline et remise en file.', 0, NULL, 'global', NULL, NULL, NULL, '1800');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('jobs.job_timeout_s', '900', 'jobs', 'Durée maximale d''une tâche (secondes)', 'Au-delà, la tâche est interrompue et retentée.', 0, NULL, 'global', NULL, NULL, NULL, '900');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mail.smtp_enabled', 'false', 'mail', 'Relais SMTP activé', 'Tant que ce réglage est désactivé, aucun courriel n''est envoyé (les demandes sont ignorées silencieusement).', 0, NULL, 'global', NULL, NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mail.smtp_host', '""', 'mail', 'Hôte SMTP', 'Nom d''hôte du serveur d''envoi, par exemple smtp.exemple.com.', 0, NULL, 'global', NULL, NULL, NULL, '""');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mail.smtp_port', '587', 'mail', 'Port SMTP', 'usuellement 587 (STARTTLS), 465 (TLS implicite) ou 25 (sans chiffrement).', 0, NULL, 'global', NULL, NULL, NULL, '587');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mail.smtp_security', '"starttls"', 'mail', 'Chiffrement', 'aucun, starttls ou tls.', 0, NULL, 'global', NULL, NULL, NULL, '"starttls"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mail.smtp_username', '""', 'mail', 'Identifiant SMTP', 'Laisser vide pour un relais qui n''exige pas d''authentification.', 0, NULL, 'global', NULL, NULL, NULL, '""');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mail.smtp_password', '""', 'mail', 'Mot de passe SMTP (chiffré)', 'Chiffré en AES-256-GCM ; jamais renvoyé par l''API ni journalisé.', 0, NULL, 'global', NULL, NULL, NULL, '""');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mail.from_address', '""', 'mail', 'Adresse d''expédition', 'Adresse figurant dans l''en-tête From des courriels envoyés par la plateforme.', 0, NULL, 'global', NULL, NULL, NULL, '""');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mail.from_name', '"Kubuno"', 'mail', 'Nom d''expédition', 'Nom affiché à côté de l''adresse d''expédition.', 0, NULL, 'global', NULL, NULL, NULL, '"Kubuno"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mail.public_url', '""', 'mail', 'URL publique de l''instance', 'Base des liens insérés dans les courriels. Vide : déduite de la requête reçue.', 0, NULL, 'global', NULL, NULL, NULL, '""');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.backup_codes_low_threshold', '3', 'security', 'Seuil d''alerte des codes de secours', 'En dessous de ce nombre de codes de secours restants, un avertissement est affiché.', 1, NULL, 'global', NULL, NULL, NULL, '3');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.reauth_token_ttl_s', '300', 'security', 'Durée du jeton de réauthentification (secondes)', 'Durée de validité de la preuve fraîche obtenue avant une action sensible.', 0, NULL, 'global', NULL, NULL, NULL, '300');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.reauth_grace_s', '900', 'security', 'Fenêtre de grâce après réauthentification (secondes)', 'Durée pendant laquelle les actions sensibles suivantes ne redemandent pas de preuve.', 0, NULL, 'global', NULL, NULL, NULL, '900');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.admin_2fa_required', 'false', 'security', 'Double authentification obligatoire pour les administrateurs', 'Les comptes administrateurs sans second facteur perdent l''accès à l''administration à l''expiration du délai de grâce. Activez-la seulement après avoir vérifié que vos administrateurs disposent de codes de secours.', 0, NULL, 'global', NULL, NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.admin_2fa_grace_days', '7', 'security', 'Délai de grâce avant application (jours)', 'Nombre de jours laissés à un administrateur sans second facteur pour en configurer un.', 0, NULL, 'global', NULL, NULL, NULL, '7');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.api_token_max_ttl_days', '365', 'security', 'Durée de vie maximale d''un jeton d''API (jours)', 'Plafond appliqué à la création. Un jeton portant une portée « core.* » en écriture ne peut jamais être sans expiration.', 0, NULL, 'global', NULL, NULL, NULL, '365');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.api_token_legacy_grace_days', '90', 'security', 'Fenêtre de grâce des jetons d''API hérités (jours)', 'Délai, à compter du marquage, pendant lequel un jeton émis avant les portées continue de fonctionner. Les écritures d''administration sont refusées immédiatement, sans grâce.', 0, NULL, 'global', NULL, NULL, NULL, '90');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('mail.last_test_ok_at', 'null', 'mail', 'Dernier test de relais réussi', 'Horodatage ISO-8601 du dernier envoi de test abouti. Écrit par le serveur uniquement.', 0, NULL, 'global', NULL, NULL, NULL, 'null');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('alerts.enabled', 'true', 'alerts', 'Centre d''alertes activé', 'Lorsque désactivé, les producteurs cessent d''écrire ; les alertes existantes restent consultables.', 0, NULL, 'global', NULL, NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('alerts.scan_interval_s', '300', 'alerts', 'Fréquence d''analyse (secondes)', 'Intervalle entre deux passages des producteurs d''alertes.', 0, NULL, 'global', NULL, NULL, NULL, '300');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('alerts.login_burst_threshold', '5', 'alerts', 'Échecs de connexion avant alerte', 'Nombre d''échecs de connexion sur un même compte dans la fenêtre ci-dessous.', 0, NULL, 'global', NULL, NULL, NULL, '5');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('alerts.login_burst_window_min', '15', 'alerts', 'Fenêtre des échecs de connexion (minutes)', 'Durée sur laquelle les échecs de connexion sont comptés.', 0, NULL, 'global', NULL, NULL, NULL, '15');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('alerts.disk_warn_percent', '15', 'alerts', 'Espace disque : seuil d''avertissement (%)', 'En dessous de ce pourcentage d''espace disponible, une alerte d''avertissement est ouverte.', 0, NULL, 'global', NULL, NULL, NULL, '15');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('alerts.disk_critical_percent', '7', 'alerts', 'Espace disque : seuil critique (%)', 'En dessous de ce pourcentage d''espace disponible, l''alerte passe en critique.', 0, NULL, 'global', NULL, NULL, NULL, '7');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('alerts.retention_days', '180', 'alerts', 'Rétention des alertes closes (jours)', 'Les alertes closes plus anciennes sont purgées avec leur historique.', 0, NULL, 'global', NULL, NULL, NULL, '180');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.enabled', 'true', 'rules', 'Moteur de règles activé', 'Lorsque désactivé, aucune règle n''est évaluée ; les règles et leur journal restent consultables.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.max_depth', '3', 'rules', 'Profondeur maximale de rétroaction', 'Une action qui modifie l''instance émet un événement, lui-même déclencheur. Au-delà de cette profondeur, l''évaluation est refusée et une alerte est levée.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.max_condition_depth', '5', 'rules', 'Profondeur maximale d''un arbre de conditions', 'Plafond validé à l''écriture d''une règle.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.max_condition_leaves', '32', 'rules', 'Nombre maximal de comparaisons dans une règle', 'Plafond validé à l''écriture d''une règle.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.execution_retention_days', '90', 'rules', 'Rétention du journal d''exécution (jours)', 'Les exécutions plus anciennes sont purgées.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.backtest_max_events', '200000', 'rules', 'Événements maximum rejoués par un test rétrospectif', 'Borne le coût d''un test rétrospectif sur une instance très active.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('devices.declared_signals_enabled', 'false', 'devices', 'Accepter les signaux déclarés par les applications natives', 'Désactivé par défaut. Une fois activé, une application native peut déclarer sa plateforme, sa version, le chiffrement du disque et le verrouillage d''écran. Ces valeurs sont affichées comme « déclarées par l''appareil » et jamais comme vérifiées.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('devices.country_db_path', '""', 'devices', 'Base de pays hors-ligne (chemin)', 'Chemin d''un fichier CSV local « début,fin,pays » (format db-ip / GeoLite2 country-block). Aucune requête sortante n''est effectuée. Vide ou absent : le pays reste inconnu et rien d''autre ne change.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('devices.block_denies_refresh', 'true', 'devices', 'Un appareil bloqué ne peut plus renouveler sa session', 'Refuse le renouvellement du jeton et la connexion depuis un appareil bloqué. Désactiver ne conserve qu''un marquage informatif.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.gate.enabled', 'true', 'rules', 'Portail de protection des données activé', 'Lorsque désactivé, le portail autorise tout sans évaluer. Les règles restent consultables.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.gate.fail_mode', '"open"', 'rules', 'Politique de défaillance du portail', 'Que fait un module quand le portail est injoignable ou trop lent. « open » : l''opération passe et l''incident est journalisé — un moteur de règles en panne ne doit pas faire tomber le service. « closed » : l''opération est refusée, pour les instances réglementées.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.gate.timeout_ms', '2000', 'rules', 'Délai maximal du portail (ms)', 'Au-delà, la politique de défaillance s''applique : l''opération passe (open) ou est refusée (closed).', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.detectors.max_part_bytes', '262144', 'rules', 'Taille maximale inspectée par partie (octets)', 'Une partie de contenu plus longue est tronquée avant inspection. Borne le coût d''une requête au portail.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.detectors.max_scan_ms', '50', 'rules', 'Temps maximal d''inspection par partie (ms)', 'L''inspection est découpée en tranches et s''arrête à ce budget. Deuxième garde-fou, indépendant de la taille : un motif écrit par un administrateur s''exécute sur du contenu produit par les utilisateurs.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('rules.detectors.max_parts', '16', 'rules', 'Nombre maximal de parties inspectées', 'Un appel au portail au-delà de ce nombre voit les parties supplémentaires ignorées.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('alerts.quota_percent', '90', 'alerts', 'Compte saturé : seuil d''alerte (%)', 'À partir de ce pourcentage de son quota, un compte ouvre une alerte de stockage. Un compte au-delà de 100 % la voit passer en critique : il ne peut plus rien enregistrer.', 0, NULL, 'global', 'int', NULL, NULL, '90');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('instance.locale', '"en"', 'general', 'Langue de l''instance', 'La langue dans laquelle l''instance s''adresse à quelqu''un dont elle ne sait rien : la page de connexion, avant toute authentification, et les courriels destinés à un compte qui n''a choisi aucune langue. Une préférence de compte l''emporte toujours sur elle.', 1, NULL, 'overridable', 'enum', '["en","fr","es","pt","it","de","el","ru","ar","he","hi","zh","ja"]', NULL, '"en"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('instance.timezone', '"UTC"', 'general', 'Fuseau horaire de l''instance', 'Identifiant IANA (Europe/Paris, America/New_York…) dans lequel l''instance date ce qu''elle écrit à un humain — l''horodatage des courriels qu''elle envoie. Les horodatages d''API et les journaux restent en temps universel : ils sont lus par des machines.', 0, NULL, 'global', 'string', NULL, NULL, '"UTC"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('backup.enabled', 'false', 'backup', 'Sauvegarde automatique activée', 'Planifie une sauvegarde des données du schéma « core » selon la fréquence choisie. Ne sauvegarde ni les fichiers stockés, ni les schémas des modules installés.', 0, NULL, 'global', 'bool', NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('backup.destination', '"/var/backups/kubuno"', 'backup', 'Répertoire de destination', 'Chemin absolu où les fichiers sont écrits. Créé au besoin, avec des droits restreints (0700) : un fichier de sauvegarde contient les empreintes de tous les mots de passe de l''instance.', 0, NULL, 'global', 'string', NULL, NULL, '"/var/backups/kubuno"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('backup.retention_count', '7', 'backup', 'Sauvegardes conservées', 'Après chaque exécution réussie, les fichiers les plus anciens au-delà de ce nombre sont supprimés. Seuls les fichiers produits par cette politique sont concernés.', 0, NULL, 'global', 'int', NULL, NULL, '7');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('backup.hour_utc', '3', 'backup', 'Heure d''exécution (UTC)', 'Heure de déclenchement, exprimée en temps universel (UTC) : le core n''a pas de fuseau d''instance.', 0, NULL, 'global', 'int', NULL, NULL, '3');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('backup.last_restore_test_at', 'null', 'backup', 'Dernière restauration testée (déclarative)', 'Horodatage déclaré par un administrateur ayant restauré une sauvegarde ailleurs. Purement déclaratif : la plateforme ne vérifie rien et ne restaure jamais d''elle-même.', 0, NULL, 'global', NULL, NULL, NULL, 'null');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('backup.frequency', '"daily"', 'backup', 'Fréquence', 'Quotidienne, ou hebdomadaire — le dimanche à l''heure choisie.', 0, NULL, 'global', 'enum', '["daily","weekly"]', NULL, '"daily"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.methods', '["local","directory","sso"]', 'auth', 'Méthodes d''authentification acceptées', 'Ce qu''une personne rattachée à cette portée a le droit d''utiliser pour se connecter : mot de passe local, annuaire LDAP / Active Directory, fournisseur SSO. Se pose par unité organisationnelle et descend aux sous-unités ; l''unité la plus proche l''emporte.', 0, NULL, 'overridable', NULL, NULL, NULL, '["local","directory","sso"]');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.local_admin_fallback', 'true', 'auth', 'Secours local des administrateurs', 'Un administrateur peut toujours utiliser son mot de passe local, même là où « local » ne figure pas parmi les méthodes acceptées. C''est la voie qui empêche une politique erronée de devenir une porte close. La désactiver est refusé si cela laissait un administrateur sans méthode utilisable.', 0, NULL, 'overridable', NULL, NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.directory_login_enabled', 'true', 'auth', 'Authentification par annuaire activée', 'Interrupteur général des annuaires LDAP / Active Directory. Désactivé, plus aucune tentative de connexion n''interroge un annuaire ; les comptes locaux ne sont pas affectés.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.directory_provision_on_login', 'true', 'auth', 'Créer les comptes à la première connexion par annuaire', 'Une personne présente dans l''annuaire mais inconnue de l''instance obtient un compte lors de sa première connexion réussie. Désactivé, seule la synchronisation crée des comptes.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('storage.usage_stale_hours', '24', 'storage', 'Déclaration de stockage périmée : seuil (heures)', 'Un module qui a déjà déclaré sa consommation et n''a plus rien déclaré depuis ce délai ouvre une alerte. Sa part reste affichée, signalée comme périmée. Un module qui n''a jamais déclaré n''ouvre aucune alerte : il n''a rien promis.', 0, NULL, 'global', 'int', NULL, NULL, '24');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('storage.usage_authoritative', 'true', 'storage', 'Recaler la consommation des comptes sur les déclarations des modules', 'Le compteur de quota d''un compte est réaligné, chaque heure, sur la somme de ce que les modules déclarent lui facturer (contenu et corbeille). Le recalage est suspendu tant qu''un module déclarant est en retard ou n''a pas encore transmis d''état complet, et chaque correction est journalisée. Désactiver conserve la répartition mais laisse le compteur dériver.', 0, NULL, 'global', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('storage.usage_correction_min_bytes', '4096', 'storage', 'Recalage : écart minimal pour corriger (octets)', 'En dessous de cet écart entre le compteur d''un compte et ce que les modules lui facturent, le compteur est laissé tel quel. Évite une correction et une entrée de journal à chaque heure pour quelques octets d''arrondi.', 0, NULL, 'global', 'int', NULL, NULL, '4096');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('users.purge_after_days', '20', 'security', 'Délai avant suppression définitive (jours)', 'Nombre de jours pendant lesquels un compte supprimé reste récupérable. Passé ce délai, il est effacé définitivement, avec ses sessions, ses jetons et ses affectations. Les comptes seulement suspendus ne sont jamais concernés.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.enabled', 'true', 'directory', 'Annuaire visible par les membres', 'Les membres peuvent rechercher les autres comptes et les voir apparaître dans les sélecteurs de personnes des modules. Désactivé, la recherche de personnes ne renvoie plus rien pour la portée concernée ; les administrateurs conservent la leur, pour ne pas s''enfermer dehors.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.share_email', 'false', 'directory', 'Publier les adresses dans l''annuaire', 'L''adresse du compte accompagne son nom dans les résultats de l''annuaire. Désactivé, seuls le nom, l''identifiant et la photo circulent — ce que l''annuaire a toujours fait jusqu''ici.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.audience', '"all_members"', 'directory', 'Étendue de l''annuaire', 'Qui figure dans l''annuaire tel que le voit une personne de cette portée : tous les comptes de l''instance, ou seulement ceux de son unité organisationnelle et des sous-unités de celle-ci.', 0, NULL, 'overridable', 'enum', '[{"label":"Tous les comptes de l''instance","value":"all_members"},{"label":"Son unité organisationnelle et ses sous-unités","value":"same_unit"}]', NULL, '"all_members"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.profile_edit_name', 'true', 'directory', 'Modifier son nom', 'Une personne peut changer le nom sous lequel elle apparaît. Désactivé, seul un administrateur le fait, et une tentative est refusée avec un message explicite plutôt qu''ignorée.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.profile_edit_photo', 'true', 'directory', 'Modifier sa photo', 'Une personne peut changer sa photo de profil, par envoi d''image comme par URL. Désactivé, la photo n''est plus modifiable que par un administrateur.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('intl.holiday_calendars', '""', 'intl', 'Calendriers de jours fériés', 'Les territoires dont les jours fériés s''affichent, séparés par des virgules (« FR », « FR-6AE,BE »). Laissé vide, le pays est déduit du fuseau horaire qui s''applique à la personne.', 1, NULL, 'overridable', 'string', NULL, NULL, '""');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('intl.holidays_enabled', 'true', 'intl', 'Jours fériés officiels', 'Diffuser le référentiel mondial livré avec Kubuno. Désactivé, seules les journées créées ici sont proposées aux modules.', 1, NULL, 'global', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('intl.holidays_dataset', '""', 'intl', 'Version du référentiel de jours fériés', 'Version du jeu de données livré actuellement chargée en base. Renseignée automatiquement au démarrage.', 0, NULL, 'global', 'string', NULL, NULL, '""');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.registration_domains_only', 'false', 'auth', 'Limiter l''inscription aux domaines de l''instance', 'À l''inscription publique, n''accepter qu''une adresse dont le domaine est déclaré ET vérifié ici. Désactivé, toute adresse valide est acceptée — ce que fait le produit depuis toujours.', 0, NULL, 'global', 'bool', NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.profile_edit_name_pronunciation', 'true', 'directory', 'Modifier la prononciation de son nom', 'Une personne peut indiquer comment son nom se prononce. Désactivé, seul un administrateur le renseigne, et une tentative est refusée avec un message explicite plutôt qu''ignorée.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.profile_edit_pronouns', 'true', 'directory', 'Modifier ses pronoms', 'Une personne peut indiquer les pronoms par lesquels elle souhaite être désignée. Désactivé, le champ n''est plus modifiable que par un administrateur.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.profile_edit_work_location', 'true', 'directory', 'Modifier son lieu de travail', 'Une personne peut indiquer où elle travaille : site, bâtiment, étage, télétravail. Désactivé, l''information relève de l''administration.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.profile_edit_introduction', 'true', 'directory', 'Modifier sa présentation', 'Une personne peut rédiger le court texte de présentation qui accompagne son profil. Désactivé, le texte n''est plus modifiable que par un administrateur.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.profile_edit_gender', 'true', 'directory', 'Modifier son genre', 'Donnée personnelle, en texte libre et jamais obligatoire. Désactivé, une personne ne peut plus renseigner ni effacer elle-même ce champ — ce qui le place sous la responsabilité de l''administration, sans le rendre plus confidentiel : il ne figure ni dans l''annuaire ni dans les sélecteurs de personnes, dans tous les cas.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.profile_edit_birthday', 'true', 'directory', 'Modifier sa date de naissance', 'Donnée personnelle, jamais obligatoire. Désactivé, une personne ne peut plus renseigner ni effacer elle-même sa date de naissance. Comme le genre, elle ne figure ni dans l''annuaire ni dans les sélecteurs de personnes.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.password_min_length', '8', 'security', 'Longueur minimale du mot de passe', 'Nombre minimal de caractères exigé lors du choix ou du changement d''un mot de passe local. Accepté entre 8 et 128 ; en dessous de 8, la valeur est refusée à l''écriture plutôt que silencieusement corrigée. Ne s''applique pas aux comptes gouvernés par un annuaire ou un fournisseur d''identité : leur mot de passe n''est pas détenu ici.', 0, NULL, 'overridable', 'int', NULL, NULL, '8');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.password_strong', 'false', 'security', 'Exiger un mot de passe robuste', 'Le mot de passe doit combiner au moins trois des quatre familles de caractères (minuscules, majuscules, chiffres, symboles) et ne pas être une répétition ou une suite triviale. Activé, un mot de passe qui ne satisfait pas la règle est refusé avec la raison exacte, jamais accepté puis signalé plus tard.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.password_reuse_allowed', 'false', 'security', 'Autoriser la réutilisation d''un ancien mot de passe', 'Désactivé, un mot de passe déjà employé par le compte est refusé — la comparaison porte sur les empreintes conservées, jamais sur des mots de passe en clair. Activé, l''historique cesse d''être consulté (il continue d''être écrit, pour que la règle redevienne effective dès sa réactivation).', 0, NULL, 'overridable', 'bool', NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.password_history_depth', '5', 'security', 'Profondeur de l''historique des mots de passe', 'Nombre d''anciens mots de passe comparés au nouveau quand la réutilisation est interdite. Accepté entre 1 et 24 : chaque entrée coûte une vérification argon2id, volontairement lente, au moment du changement.', 0, NULL, 'overridable', 'int', NULL, NULL, '5');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.password_expiry_days', '0', 'security', 'Expiration du mot de passe (jours)', 'Au-delà de cet âge, la prochaine connexion réussie impose le changement du mot de passe avant toute autre action. 0 désactive l''expiration. Les comptes existants comptent leur âge depuis leur création : activer l''expiration renouvellera donc immédiatement les mots de passe les plus anciens.', 0, NULL, 'overridable', 'int', NULL, NULL, '0');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.password_enforce_at_login', 'false', 'security', 'Appliquer la politique à la prochaine connexion', 'Le mot de passe présenté à la connexion est confronté à la politique en vigueur ; s''il ne la satisfait plus, la session s''ouvre mais impose d''abord un changement. Désactivé, un durcissement de la politique ne s''applique qu''aux mots de passe choisis après lui.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('auth.self_service_recovery', 'true', 'security', 'Réinitialisation autonome du mot de passe', 'Le formulaire « mot de passe oublié » envoie un lien de réinitialisation. Désactivé pour une portée, la demande reste acceptée à l''identique — aucune réponse ne révèle l''existence d''un compte — mais aucun lien n''est émis : seul un administrateur peut alors réinitialiser le mot de passe.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('data_export.destination', '"/var/lib/kubuno/exports"', 'data_export', 'Répertoire des archives', 'Chemin absolu où les archives sont écrites, sur le disque de l''instance. Créé au besoin avec des droits restreints (0700) : une archive contient les données personnelles de tous les comptes qu''elle couvre.', 0, NULL, 'global', 'string', NULL, NULL, '"/var/lib/kubuno/exports"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('data_export.hold_hours', '48', 'data_export', 'Délai de sécurité avant mise à disposition (heures)', 'Une archive produite n''est téléchargeable qu''après ce délai. C''est la protection principale contre un export déclenché depuis une session administrateur volée : les autres administrateurs sont prévenus immédiatement et disposent de ce délai pour annuler. Zéro supprime la protection.', 0, NULL, 'global', 'int', NULL, NULL, '48');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('data_export.retention_days', '7', 'data_export', 'Durée de disponibilité de l''archive (jours)', 'Après ce délai, comptés à partir de la mise à disposition, l''archive est supprimée du disque automatiquement, qu''elle ait été téléchargée ou non. L''entrée d''historique, elle, est conservée.', 0, NULL, 'global', 'int', NULL, NULL, '7');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('data_export.max_file_mb', '2048', 'data_export', 'Taille maximale d''un fichier dans l''archive (Mio)', 'Un fichier plus volumineux n''est pas inclus : son absence est signalée dans le manifeste de l''archive, avec sa taille réelle. Évite qu''un seul objet rende l''archive inexploitable.', 0, NULL, 'global', 'int', NULL, NULL, '2048');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('data_export.module_timeout_s', '600', 'data_export', 'Délai d''attente par module et par compte (secondes)', 'Au-delà, le module est considéré injoignable pour ce compte : son absence est consignée dans le manifeste et l''export continue. Un module en panne ne doit jamais faire échouer l''export des autres.', 0, NULL, 'global', 'int', NULL, NULL, '600');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('data_export.require_2fa', 'true', 'data_export', 'Exiger la double authentification', 'Réserve le déclenchement d''un export aux administrateurs dont le compte est protégé par une seconde étape d''authentification. Désactiver ce contrôle rend un export possible depuis un simple mot de passe.', 0, NULL, 'global', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('data_export.min_admin_age_days', '30', 'data_export', 'Ancienneté minimale du compte demandeur (jours)', 'Un compte administrateur créé plus récemment ne peut pas déclencher d''export. Contre le scénario où un accès obtenu sert immédiatement à créer un second compte et à tout emporter avec.', 0, NULL, 'global', 'int', NULL, NULL, '30');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('data_export.self_service', 'true', 'data_export', 'Autoriser chacun à exporter ses propres données', 'Ouvre, dans les réglages du compte, une page « Télécharger mes données » : l''utilisateur choisit les services, demande une archive et la récupère quand elle est prête. L''archive ne contient que SES données et jamais celles d''un autre compte. Réglable par unité organisationnelle, par groupe ou par compte : là où ce réglage est désactivé, ni la page ni l''option n''apparaissent — la fonction disparaît de l''interface au lieu d''y figurer grisée.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('data_export.self_hold_hours', '0', 'data_export', 'Délai de sécurité du libre-service (heures)', 'Attente imposée entre la production d''une archive personnelle et son téléchargement. Zéro par défaut, à la différence de l''export administrateur : le délai de 48 h protège contre l''exfiltration de TOUS les comptes depuis une session volée, alors qu''une session volée peut déjà lire dans l''interface les données du seul compte concerné ici. Le relever protège peu et retarde beaucoup une demande légitime de portabilité.', 0, NULL, 'global', 'int', NULL, NULL, '0');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('data_export.self_max_downloads', '5', 'data_export', 'Téléchargements autorisés par archive personnelle', 'Nombre de fois qu''une archive personnelle peut être récupérée avant de devoir en redemander une. Une adresse de téléchargement rejouable indéfiniment est une copie du compte sans son contrôle d''accès. Le plafond est figé à la création de l''archive : le modifier n''affecte que les demandes suivantes.', 0, NULL, 'global', 'int', NULL, NULL, '5');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('usage.retention_days', '90', 'general', 'Rétention des compteurs de fréquentation (jours)', 'Au-delà, les compteurs (jour, module, compte) du tableau de bord sont effacés. 0 désactive la conservation.', 0, NULL, 'global', NULL, NULL, NULL, NULL);
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.profile_edit_first_name', 'true', 'directory', 'Modifier son prénom', 'Une personne peut renseigner son prénom. Désactivé, seul un administrateur le fait, et une tentative est refusée avec un message explicite plutôt qu''ignorée.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('directory.profile_edit_last_name', 'true', 'directory', 'Modifier son nom de famille', 'Une personne peut renseigner son nom de famille. Désactivé, seul un administrateur le fait, et une tentative est refusée avec un message explicite plutôt qu''ignorée.', 0, NULL, 'overridable', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.https_port', '8443', 'network', 'Port HTTPS', 'Port d''écoute du HTTPS quand le core termine le TLS lui-même. Le port 443 (web standard) exige que le service ait la capacité CAP_NET_BIND_SERVICE ; 8443 fonctionne sans privilège. Un changement de port ne prend effet qu''au redémarrage.', 0, NULL, 'global', 'int', NULL, NULL, '8443');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.hsts_enabled', 'true', 'network', 'En-tête HSTS (HTTP Strict Transport Security)', 'Indique au navigateur de n''accéder au site qu''en HTTPS pendant la durée ci-dessous. L''en-tête n''est émis que lorsque le core sert réellement en HTTPS : l''activer sans HTTPS n''a aucun effet. Prend effet à chaud.', 0, NULL, 'global', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.hsts_max_age_days', '365', 'network', 'Durée du HSTS (jours)', 'Combien de temps le navigateur doit refuser le HTTP en clair après avoir vu l''en-tête. Une durée longue renforce la protection mais engage l''instance à rester joignable en HTTPS pendant toute cette période.', 0, NULL, 'global', 'int', NULL, NULL, '365');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.hsts_include_subdomains', 'true', 'network', 'HSTS : inclure les sous-domaines', 'Étend la contrainte HTTPS à tous les sous-domaines. Ne l''activez que si tous vos sous-domaines savent servir en HTTPS.', 0, NULL, 'global', 'bool', NULL, NULL, 'true');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.hsts_preload', 'false', 'network', 'HSTS : éligibilité au préchargement', 'Ajoute la directive « preload », condition pour être inscrit dans la liste de préchargement HSTS des navigateurs. À n''activer qu''en connaissance de cause : le retrait de cette liste est lent et manuel.', 0, NULL, 'global', 'bool', NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.tls_min_version', '"1.2"', 'network', 'Version minimale de TLS', 'Version la plus ancienne de TLS que le core acceptera. TLS 1.2 est le plancher recommandé aujourd''hui ; TLS 1.3 uniquement offre la meilleure sécurité mais peut exclure des clients anciens. Les versions antérieures (SSLv3, TLS 1.0, TLS 1.1), obsolètes et vulnérables, ne sont de toute façon pas prises en charge. Ce réglage est appliqué au prochain rechargement du certificat ou au redémarrage.', 0, NULL, 'global', 'enum', '[{"label":"TLS 1.2","value":"1.2"},{"label":"TLS 1.3","value":"1.3"}]', NULL, '"1.2"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.https_enabled', 'false', 'network', 'Terminer le HTTPS dans le core', 'Le core sert directement en HTTPS avec le certificat actif, sans reverse-proxy. Nécessite un certificat installé. Le port HTTP continue d''être servi en parallèle : activer le HTTPS ne coupe ni un mandataire inverse ni une sonde qui l''utilise. Lier ou délier la socket HTTPS ne prend effet qu''au redémarrage du service. Inutile si un reverse-proxy (nginx…) termine déjà le TLS devant le core.', 0, NULL, 'global', 'bool', NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.http_redirect_port', '80', 'network', 'Port de la redirection HTTP', 'Port HTTP SUPPLÉMENTAIRE à écouter en plus du port habituel, typiquement 80 pour recevoir le trafic web standard et le rediriger. Utilisé uniquement quand la redirection ci-dessus est activée. Un port inférieur à 1024 exige la capacité CAP_NET_BIND_SERVICE ; s''il ne peut pas être lié, le service démarre quand même et le signale dans le journal.', 0, NULL, 'global', 'int', NULL, NULL, '80');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.acme_directory_url', '"https://acme-v02.api.letsencrypt.org/directory"', 'network', 'Répertoire ACME', 'URL du répertoire de l''autorité de certification ACME. Par défaut Let''s Encrypt (production). Pour les premiers essais, utilisez le répertoire de test (staging) « https://acme-staging-v02.api.letsencrypt.org/directory » : ses quotas sont larges et il ne consomme pas les limites de production. Les certificats de staging ne sont pas reconnus par les navigateurs.', 0, NULL, 'global', 'string', NULL, NULL, '"https://acme-v02.api.letsencrypt.org/directory"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.acme_email', '""', 'network', 'Adresse de contact ACME', 'Adresse à laquelle l''autorité enverra les avis d''expiration et les alertes. Requise pour créer un compte ACME.', 0, NULL, 'global', 'string', NULL, NULL, '""');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.acme_domains', '""', 'network', 'Domaines à certifier', 'Liste des domaines (séparés par des virgules ou des espaces) que le certificat automatique doit couvrir, par ex. « exemple.fr, www.exemple.fr ». Chaque domaine doit pointer vers cette instance et être joignable en HTTP sur le port 80 : l''autorité vérifie la maîtrise du domaine en récupérant « http://<domaine>/.well-known/acme-challenge/… » servi par le core.', 0, NULL, 'global', 'string', NULL, NULL, '""');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.acme_tos_agreed', 'false', 'network', 'Accepter les conditions d''utilisation de l''autorité', 'La création d''un compte ACME exige l''acceptation des conditions d''utilisation de l''autorité de certification (pour Let''s Encrypt : https://letsencrypt.org/repository/). Cochez pour marquer votre accord.', 0, NULL, 'global', 'bool', NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.cert_mode', '"manual"', 'network', 'Mode de gestion du certificat', 'Manuel : vous fournissez le certificat et sa clé, et vous les remplacez vous-même avant expiration. Automatique (ACME / Let''s Encrypt) : le core obtient le certificat tout seul et le renouvelle 30 jours avant son expiration ; renseignez alors le répertoire, l''adresse de contact et les domaines ci-dessous.', 0, NULL, 'global', 'enum', '[{"label":"Manuel","value":"manual"},{"label":"Automatique (ACME)","value":"acme"}]', NULL, '"manual"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('network.http_redirect_to_https', 'false', 'network', 'Rediriger le HTTP vers le HTTPS', 'Sur le port HTTP, répondre à chaque requête par une redirection permanente (308) vers son équivalent HTTPS, au lieu de servir l''application. Deux exceptions, toujours servies en clair : la validation ACME (« /.well-known/acme-challenge/… »), sans quoi le renouvellement automatique cesserait de fonctionner ; et les requêtes qu''un mandataire inverse de confiance annonce comme déjà chiffrées (« X-Forwarded-Proto: https »), qu''il serait absurde de renvoyer vers HTTPS. Sans effet si le HTTPS n''est pas terminé par le core. Prise en compte au redémarrage.', 0, NULL, 'global', 'bool', NULL, NULL, 'false');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.login_captcha_after_failures', '3', 'security', 'CAPTCHA après échecs de connexion', 'Au-delà de ce nombre d''échecs consécutifs sur un même compte, la connexion exige la résolution d''un CAPTCHA — généré et vérifié par le serveur, sans service tiers — jusqu''à la première réussite, qui remet le compteur à zéro. 0 désactive le CAPTCHA. Le compteur est celui du verrouillage de compte (échecs consécutifs depuis la dernière réussite) ; il se réinitialise aussi lors d''une réinitialisation du mot de passe.', 0, NULL, 'overridable', 'int', NULL, NULL, '3');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.captcha_type', '"text"', 'security', 'Type de test humain', 'Le genre de défi présenté quand un CAPTCHA est exigé : « Texte déformé » (recopier des caractères), « Puzzle coulissant » (faire glisser une pièce jusqu''à sa place dans l''image) ou « Calcul » (résoudre une petite opération). Tous sont générés et vérifiés par le serveur, sans service tiers.', 0, NULL, 'global', 'enum', '[{"label":"Texte déformé","value":"text"},{"label":"Puzzle coulissant","value":"slider"},{"label":"Calcul","value":"math"}]', NULL, '"text"');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.captcha_length', '5', 'security', 'Longueur du code (texte)', 'Nombre de caractères à recopier, pour le type « Texte déformé ». Accepté entre 4 et 8 : plus long = plus dur à deviner et à lire.', 0, NULL, 'global', 'int', NULL, NULL, '5');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.captcha_distortion', '40', 'security', 'Force de déformation (texte)', 'Intensité de la rotation et de l''ondulation des caractères, de 0 (droits, faciles à lire) à 100 (fortement déformés, plus résistants aux robots mais plus pénibles à lire). N''affecte que le type « Texte déformé ». 40 par défaut.', 0, NULL, 'global', 'int', NULL, NULL, '40');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.captcha_noise', '40', 'security', 'Bruit visuel (texte)', 'Densité des points parasites et des lignes qui traversent l''image, de 0 (fond propre) à 100 (très bruité). N''affecte que le type « Texte déformé ». 40 par défaut.', 0, NULL, 'global', 'int', NULL, NULL, '40');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.captcha_slider_tolerance', '6', 'security', 'Tolérance du puzzle (pixels)', 'Écart maximal, en pixels, entre la position où l''utilisateur relâche la pièce et son emplacement exact, pour le type « Puzzle coulissant ». Plus la valeur est basse, plus il faut être précis. Accepté entre 2 et 20 ; 6 par défaut.', 0, NULL, 'global', 'int', NULL, NULL, '6');
INSERT INTO "core"."settings" ("key", "value", "category", "label", "description", "is_public", "updated_by", "scope", "value_type", "allowed_values", "module_id", "default_value") VALUES ('security.captcha_math_max', '10', 'security', 'Valeur maximale (calcul)', 'Plus grand nombre utilisé dans l''opération, pour le type « Calcul » (une addition de deux nombres tirés entre 1 et cette valeur). Accepté entre 5 et 50 ; 10 par défaut.', 0, NULL, 'global', 'int', NULL, NULL, '10');

-- privileges (51 rows)
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.users.read', 'core', 'users', 'read', 'Consulter les comptes', 'Lister et afficher les comptes utilisateurs.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.users.create', 'core', 'users', 'create', 'Créer des comptes', 'Créer un compte utilisateur.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.users.update', 'core', 'users', 'update', 'Modifier des comptes', 'Modifier profil, quota et unité d''un compte.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.users.delete', 'core', 'users', 'delete', 'Supprimer des comptes', 'Désactiver définitivement un compte.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.user_suspension.execute', 'core', 'user_suspension', 'execute', 'Suspendre / réactiver un compte', 'Basculer l''état actif d''un compte.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.user_password.execute', 'core', 'user_password', 'execute', 'Réinitialiser un mot de passe', 'Définir un nouveau mot de passe et révoquer les sessions du compte.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.sessions.read', 'core', 'sessions', 'read', 'Consulter les sessions', 'Lister les sessions actives d''un compte.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.sessions.delete', 'core', 'sessions', 'delete', 'Révoquer des sessions', 'Révoquer une session ou toutes les sessions d''un compte.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.org_units.read', 'core', 'org_units', 'read', 'Consulter les unités', 'Lister les unités organisationnelles.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.org_units.manage', 'core', 'org_units', 'manage', 'Gérer les unités', 'Créer, renommer, déplacer et supprimer des unités organisationnelles.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.groups.read', 'core', 'groups', 'read', 'Consulter les groupes', 'Lister les groupes et leurs membres.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.groups.manage', 'core', 'groups', 'manage', 'Gérer les groupes', 'Créer, modifier, supprimer des groupes et leurs membres.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.roles.read', 'core', 'roles', 'read', 'Consulter les rôles', 'Lister les rôles, leurs privilèges et leurs affectations.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.settings.read', 'core', 'settings', 'read', 'Consulter les réglages', 'Lire les réglages de l''instance.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.settings.manage', 'core', 'settings', 'manage', 'Modifier les réglages', 'Modifier les réglages de l''instance.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.stats.read', 'core', 'stats', 'read', 'Consulter le tableau de bord', 'Lire les statistiques agrégées de l''instance.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.modules.read', 'core', 'modules', 'read', 'Consulter les modules', 'Lister les modules installés et leur état.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.modules.manage', 'core', 'modules', 'manage', 'Gérer les modules', 'Activer et désactiver des modules.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.auth_providers.read', 'core', 'auth_providers', 'read', 'Consulter les fournisseurs d''identité', 'Lister les fournisseurs OAuth/OIDC.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.auth_providers.manage', 'core', 'auth_providers', 'manage', 'Gérer les fournisseurs d''identité', 'Créer, modifier, supprimer des fournisseurs OAuth/OIDC.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.themes.read', 'core', 'themes', 'read', 'Consulter les thèmes', 'Lister les thèmes installés.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.mail.read', 'core', 'mail', 'read', 'Consulter le relais de courriel', 'Lire la configuration SMTP sortante.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.mail.manage', 'core', 'mail', 'manage', 'Configurer le relais de courriel', 'Modifier la configuration SMTP et envoyer un message de test.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.audit.read', 'core', 'audit', 'read', 'Consulter le journal d''audit', 'Lire, filtrer et exporter le journal d''administration.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.api_tokens.read', 'core', 'api_tokens', 'read', 'Consulter les jetons d''API', 'Lister les jetons d''API émis sur l''instance.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.api_tokens.manage', 'core', 'api_tokens', 'manage', 'Gérer les jetons d''API', 'Révoquer des jetons d''API.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.roles.manage', 'core', 'roles', 'manage', 'Gérer les rôles', 'Créer, modifier, supprimer des rôles et leurs affectations. Réservé aux super-utilisateurs.', 0, 0, 0);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.marketplace.manage', 'core', 'marketplace', 'manage', 'Installer des modules', 'Parcourir la place de marché. L''installation reste réservée aux super-utilisateurs.', 0, 0, 0);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.themes.manage', 'core', 'themes', 'manage', 'Gérer les thèmes', 'Créer et supprimer des thèmes. Import et approbation réservés aux super-utilisateurs.', 0, 0, 0);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.module_admin.execute', 'core', 'module_admin', 'execute', 'Agir en administrateur auprès des modules', 'Autorise le porteur à être présenté aux modules avec le rôle « admin » (en-tête X-Kubuno-User-Role). Sans cette portée, un jeton est toujours présenté comme un utilisateur ordinaire, quel que soit le rôle de son propriétaire.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.mcp.execute', 'core', 'mcp', 'execute', 'Utiliser le serveur MCP', 'Autorise le porteur à appeler /mcp et à exécuter les outils exposés par les modules. Cette route s''authentifie uniquement par jeton d''API.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.alerts.read', 'core', 'alerts', 'read', 'Consulter les alertes', 'Lire le centre d''alertes, ses filtres et le détail d''une alerte.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.alerts.manage', 'core', 'alerts', 'manage', 'Traiter les alertes', 'Prendre en charge, assigner, commenter, clore ou ignorer une alerte, et exécuter ses actions recommandées.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.rules.read', 'core', 'rules', 'read', 'Consulter les règles', 'Lire les règles d''administration, leur catalogue, leur historique et leur journal d''exécution.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.rules.manage', 'core', 'rules', 'manage', 'Écrire les règles d''administration', 'Créer, modifier, activer et supprimer des règles. Écrire une règle, c''est pouvoir suspendre des comptes et révoquer des sessions automatiquement : ce privilège est distinct de l''administration courante.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.storage.read', 'core', 'storage', 'read', 'Consulter le stockage', 'Lire la consommation de l''instance, sa répartition et les comptes qui consomment le plus.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.backup.read', 'core', 'backup', 'read', 'Consulter les sauvegardes', 'Lire la politique de sauvegarde, l''historique des exécutions et l''état de la dernière.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.backup.manage', 'core', 'backup', 'manage', 'Déclencher une sauvegarde', 'Lancer une sauvegarde immédiate et déclarer qu''une restauration a été testée. Modifier la politique reste régi par core.settings.manage.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.audiences.read', 'core', 'audiences', 'read', 'Consulter les audiences cibles', 'Lister les audiences cibles, leurs membres et leur application.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.audiences.manage', 'core', 'audiences', 'manage', 'Gérer les audiences cibles', 'Créer, renommer, supprimer des audiences et modifier leurs membres.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.audience_policy.execute', 'core', 'audience_policy', 'execute', 'Appliquer les audiences cibles', 'Choisir quelles audiences sont proposées, dans quel module et pour quelle unité organisationnelle.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.resources.read', 'core', 'resources', 'read', 'Consulter les bâtiments et les ressources', 'Lister les bâtiments, leurs étages, les ressources réservables et leurs fonctionnalités.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.resources.manage', 'core', 'resources', 'manage', 'Gérer les bâtiments et les ressources', 'Créer, modifier et supprimer des bâtiments, des ressources et des fonctionnalités.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.holidays.read', 'core', 'holidays', 'read', 'Consulter les jours fériés', 'Ouvrir le référentiel des jours fériés et journées spéciales, et voir ce qui s''applique à chaque unité.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.holidays.manage', 'core', 'holidays', 'manage', 'Gérer les jours fériés', 'Créer, modifier, désactiver des journées et des calendriers de territoires, et ajuster ce qu''une unité observe.', 1, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.domains.read', 'core', 'domains', 'read', 'Consulter les domaines', 'Voir les domaines déclarés par l''instance, leur état de vérification et le diagnostic de leur messagerie.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.domains.manage', 'core', 'domains', 'manage', 'Gérer les domaines', 'Ajouter un domaine, prouver sa propriété, promouvoir le domaine principal et retirer un domaine.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.data_migration.read', 'core', 'data_migration', 'read', 'Consulter les migrations de données', 'Voir les campagnes de migration, la correspondance des comptes et leur avancement.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.data_migration.manage', 'core', 'data_migration', 'manage', 'Gérer les migrations de données', 'Créer une campagne, enregistrer les identifiants du serveur source, lancer, interrompre et relancer une migration.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.data_export.read', 'core', 'data_export', 'read', 'Consulter les exports de données', 'Lire l''historique des exports, leur état d''avancement, et télécharger une archive produite.', 0, 0, 1);
INSERT INTO "core"."privileges" ("key", "namespace", "domain", "verb", "label", "description", "is_ou_scopable", "is_orphan", "is_token_grantable") VALUES ('core.data_export.execute', 'core', 'data_export', 'execute', 'Exporter les données', 'Déclencher la production d''une archive contenant les données de l''instance ou d''une sélection de comptes, et annuler ou supprimer une archive. Opération à haut risque : tous les administrateurs en sont notifiés.', 0, 0, 1);

-- roles (7 rows)
INSERT INTO "core"."roles" ("id", "slug", "name", "description", "is_system", "is_superuser") VALUES (X'0b0d956e7d5644359e2d3ca351df4f4c', 'super-admin', 'Super-administrateur', 'Détient tous les privilèges, présents et futurs. Seul habilité à gérer les rôles, installer des modules et approuver des thèmes.', 1, 1);
INSERT INTO "core"."roles" ("id", "slug", "name", "description", "is_system", "is_superuser") VALUES (X'5ee97ea9040f437890a6a9c1d1810313', 'user-admin', 'Administrateur des utilisateurs', 'Gère les comptes et leurs sessions. Tous ses privilèges sont restreignables : ce rôle peut être délégué sur une unité organisationnelle.', 1, 0);
INSERT INTO "core"."roles" ("id", "slug", "name", "description", "is_system", "is_superuser") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'read-only-admin', 'Administrateur en lecture seule', 'Consulte toute la console d''administration sans rien pouvoir modifier.', 1, 0);
INSERT INTO "core"."roles" ("id", "slug", "name", "description", "is_system", "is_superuser") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'service-admin', 'Administrateur des services', 'Gère les modules, les thèmes, les fournisseurs d''identité et le relais de courriel. Ne touche pas aux comptes.', 1, 0);
INSERT INTO "core"."roles" ("id", "slug", "name", "description", "is_system", "is_superuser") VALUES (X'c9620d4173fb4fcaa7d843bb5bce1c0a', 'support-admin', 'Administrateur du support', 'Guichet de support : réinitialise un mot de passe, consulte et révoque les sessions, et lit les comptes. Ne crée, ne suspend et ne supprime aucun compte ; ne touche ni aux quotas, ni aux unités, ni aux rôles. Tous ses privilèges sont restreignables : ce rôle peut être délégué sur une unité organisationnelle.', 1, 0);
INSERT INTO "core"."roles" ("id", "slug", "name", "description", "is_system", "is_superuser") VALUES (X'a4269308e3c24e54b41eecb103b7272b', 'directory-reader', 'Lecture d''annuaire', 'Consulte les comptes et les unités organisationnelles de son périmètre, sans aucune modification. Ne lit ni le journal d''audit, ni les réglages, ni les modules — c''est ce qui le distingue de l''administrateur en lecture seule, et ce qui le rend délégable sur une unité organisationnelle.', 1, 0);
INSERT INTO "core"."roles" ("id", "slug", "name", "description", "is_system", "is_superuser") VALUES (X'252014500cc34a919b7cfa379118772e', 'group-admin', 'Administrateur des groupes', 'Crée, modifie et supprime les groupes ainsi que leurs membres. Ne touche ni aux comptes, ni aux unités organisationnelles, ni aux réglages. Un groupe traversant les unités par construction, ce rôle s''exerce nécessairement sur toute l''instance et ne peut pas être restreint à une unité.', 1, 0);

-- role_privileges (52 rows)
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'5ee97ea9040f437890a6a9c1d1810313', 'core.users.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'5ee97ea9040f437890a6a9c1d1810313', 'core.users.create');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'5ee97ea9040f437890a6a9c1d1810313', 'core.users.update');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'5ee97ea9040f437890a6a9c1d1810313', 'core.users.delete');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'5ee97ea9040f437890a6a9c1d1810313', 'core.user_suspension.execute');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'5ee97ea9040f437890a6a9c1d1810313', 'core.user_password.execute');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'5ee97ea9040f437890a6a9c1d1810313', 'core.sessions.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'5ee97ea9040f437890a6a9c1d1810313', 'core.sessions.delete');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'5ee97ea9040f437890a6a9c1d1810313', 'core.org_units.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.users.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.sessions.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.org_units.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.groups.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.roles.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.settings.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.stats.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.modules.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.auth_providers.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.themes.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.mail.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.audit.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.api_tokens.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.modules.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.modules.manage');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.marketplace.manage');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.themes.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.themes.manage');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.auth_providers.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.auth_providers.manage');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.mail.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.mail.manage');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.settings.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.stats.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'c9620d4173fb4fcaa7d843bb5bce1c0a', 'core.user_password.execute');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'c9620d4173fb4fcaa7d843bb5bce1c0a', 'core.sessions.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'c9620d4173fb4fcaa7d843bb5bce1c0a', 'core.sessions.delete');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'c9620d4173fb4fcaa7d843bb5bce1c0a', 'core.users.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'a4269308e3c24e54b41eecb103b7272b', 'core.users.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'a4269308e3c24e54b41eecb103b7272b', 'core.org_units.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'252014500cc34a919b7cfa379118772e', 'core.groups.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'252014500cc34a919b7cfa379118772e', 'core.groups.manage');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.alerts.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.alerts.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.alerts.manage');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.rules.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.storage.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.storage.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.backup.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.backup.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.backup.manage');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'f74dabba4cad449b9c77c8e1c9e7c598', 'core.data_export.read');
INSERT INTO "core"."role_privileges" ("role_id", "privilege_key") VALUES (X'e69b3ab35ffd4212b4a7dfd941d34085', 'core.data_export.read');

-- setting_values (19 rows)
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.enabled', 'instance', X'00000000000000000000000000000000', 'true', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.max_depth', 'instance', X'00000000000000000000000000000000', '3', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.max_condition_depth', 'instance', X'00000000000000000000000000000000', '5', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.max_condition_leaves', 'instance', X'00000000000000000000000000000000', '32', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.execution_retention_days', 'instance', X'00000000000000000000000000000000', '90', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.backtest_max_events', 'instance', X'00000000000000000000000000000000', '200000', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('devices.declared_signals_enabled', 'instance', X'00000000000000000000000000000000', 'false', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('devices.country_db_path', 'instance', X'00000000000000000000000000000000', '""', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('devices.block_denies_refresh', 'instance', X'00000000000000000000000000000000', 'true', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.gate.enabled', 'instance', X'00000000000000000000000000000000', 'true', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.gate.fail_mode', 'instance', X'00000000000000000000000000000000', '"open"', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.gate.timeout_ms', 'instance', X'00000000000000000000000000000000', '2000', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.detectors.max_part_bytes', 'instance', X'00000000000000000000000000000000', '262144', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.detectors.max_scan_ms', 'instance', X'00000000000000000000000000000000', '50', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('rules.detectors.max_parts', 'instance', X'00000000000000000000000000000000', '16', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('auth.directory_login_enabled', 'instance', X'00000000000000000000000000000000', 'true', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('auth.directory_provision_on_login', 'instance', X'00000000000000000000000000000000', 'true', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('users.purge_after_days', 'instance', X'00000000000000000000000000000000', '20', 0, NULL);
INSERT INTO "core"."setting_values" ("key", "scope_type", "scope_id", "value", "locked", "updated_by") VALUES ('usage.retention_days', 'instance', X'00000000000000000000000000000000', '90', 0, NULL);

-- user_groups (3 rows)
INSERT INTO "core"."user_groups" ("id", "name", "description", "permissions", "is_default", "is_system", "ldap_directory_id", "ldap_dn", "oauth_provider_slug", "release_exempt") VALUES (X'aa1ec7556d5645889632ef7dcac005ed', 'Utilisateurs', 'Groupe de base — tous les nouveaux utilisateurs', '["api_tokens.create"]', 1, 1, NULL, NULL, NULL, 0);
INSERT INTO "core"."user_groups" ("id", "name", "description", "permissions", "is_default", "is_system", "ldap_directory_id", "ldap_dn", "oauth_provider_slug", "release_exempt") VALUES (X'cb3ecbb4630843ad836d7f5e9527eb46', 'Invités', 'Accès minimal, aucune action avancée', '[]', 0, 1, NULL, NULL, NULL, 0);
INSERT INTO "core"."user_groups" ("id", "name", "description", "permissions", "is_default", "is_system", "ldap_directory_id", "ldap_dn", "oauth_provider_slug", "release_exempt") VALUES (X'8d7fb54abaf847c9afa13371f038095e', 'Administrateurs', 'Accès complet à l''administration', '["admin.*"]', 0, 1, NULL, NULL, NULL, 0);

-- target_audiences (1 rows)
INSERT INTO "core"."target_audiences" ("id", "name", "description", "is_everyone", "created_by") VALUES (X'97fa3447f6114b07ab7672486dd92cb6', 'Toute l''organisation', 'Tous les comptes actifs de cette instance.', 1, NULL);

-- org_units (1 rows)
INSERT INTO "core"."org_units" ("id", "name", "parent_id", "description") VALUES (X'4ef8aec724bf47429f4d59c16ab34b85', 'Kubuno', NULL, NULL);

-- content_detectors (14 rows)
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'0ed4834e8f47460d9fc8d2ffd41035ef', 'core.nir', 'Numéro de sécurité sociale (NIR)', 'Numéro d''inscription au répertoire, 15 chiffres avec sa clé de contrôle. La clé (modulo 97) est vérifiée, y compris la correction corse 2A/2B.', 'identity', 'checksum', '\b[12][ ]?\d{2}[ ]?\d{2}[ ]?(?:\d{2}|2[AB])[ ]?\d{3}[ ]?\d{3}[ ]?\d{2}\b', '[]', 'nir', '["sécurité sociale","securite sociale","numéro de sécurité","nir","carte vitale","assuré social","assure social"]', 150, 0, 0.6, 0.35, 0.05, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'd1543a5a30c943429446d5a85e6a7994', 'core.plate', 'Plaque d''immatriculation', 'Immatriculation française, système SIV (AA-123-AA) ou ancien FNI (1234 AB 56). La forme seule est trop banale : un mot-clé de proximité est exigé.', 'identity', 'regex', '\b(?:[A-Z]{2}[- ]\d{3}[- ][A-Z]{2}|\d{1,4}[ ][A-Z]{2,3}[ ]\d{2})\b', '[]', NULL, '["immatriculation","plaque","véhicule","vehicule","carte grise","voiture","automobile"]', 150, 1, 0.45, 0, 0.3, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'd82cb2474722463b9c2ee9bc1b3fa282', 'core.iban', 'IBAN', 'Numéro de compte bancaire international. Le contrôle modulo 97-10 est appliqué : une suite de caractères de la bonne forme mais fausse est écartée.', 'finance', 'checksum', '\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\b', '[]', 'iban', '["iban","virement","rib","compte bancaire","bic","coordonnées bancaires","coordonnees bancaires"]', 150, 0, 0.6, 0.35, 0.05, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'2d6d0cfbc43440eab131d308e2a69d49', 'core.bic', 'BIC / SWIFT', 'Code d''identification bancaire. Aucune somme de contrôle n''existe : la proximité d''un mot-clé est ce qui distingue un BIC d''un acronyme de huit lettres.', 'finance', 'regex', '\b[A-Z]{4}(?:FR|BE|CH|LU|DE|ES|IT|PT|NL|GB|CA|MA|SN|CI|TN|DZ)[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b', '[]', NULL, '["bic","swift","iban","virement","banque","coordonnées bancaires","coordonnees bancaires"]', 150, 1, 0.45, 0, 0.3, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'5fd1643df1f84fad9a7cf76b20510dea', 'core.card', 'Numéro de carte bancaire', 'Carte de paiement, 13 à 19 chiffres. La clé de Luhn est vérifiée : sans elle, tout numéro de commande de seize chiffres serait une carte.', 'finance', 'checksum', '\b(?:\d[ -]?){12,18}\d\b', '[]', 'luhn', '["carte","cb","visa","mastercard","cvv","cvc","expire","paiement","bancaire","carte bleue"]', 120, 0, 0.5, 0.35, 0.15, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'8b2b126c916f49fd9d19035d5de37138', 'core.rib', 'RIB français', 'Relevé d''identité bancaire : code banque, code guichet, numéro de compte et clé RIB. La clé (modulo 97) est vérifiée, lettres du compte converties.', 'finance', 'checksum', '\b\d{5}[ ]?\d{5}[ ]?[A-Z0-9]{11}[ ]?\d{2}\b', '[]', 'rib_fr', '["rib","relevé d''identité","releve d''identite","banque","guichet","virement","prélèvement","prelevement"]', 150, 0, 0.55, 0.35, 0.1, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'485e7769ed6a4d9ea90e825383e78496', 'core.siren', 'SIREN', 'Identifiant d''entreprise à 9 chiffres, clé de Luhn vérifiée. Peu sensible seul : sans mot-clé adjacent, la confiance reste sous le seuil par défaut.', 'finance', 'checksum', '\b\d{3}[ ]?\d{3}[ ]?\d{3}\b', '[]', 'luhn', '["siren","entreprise","société","societe","rcs","greffe","immatriculation","kbis"]', 120, 0, 0.35, 0.25, 0.25, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'6f41180a97ce4dddbbd1fd1867461d07', 'core.siret', 'SIRET', 'Identifiant d''établissement à 14 chiffres, clé de Luhn vérifiée (règle particulière de La Poste incluse).', 'finance', 'checksum', '\b\d{3}[ ]?\d{3}[ ]?\d{3}[ ]?\d{5}\b', '[]', 'siret', '["siret","établissement","etablissement","entreprise","société","societe","facture"]', 120, 0, 0.5, 0.3, 0.15, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'c89d6d0a54e7460e80bd7f472cee2403', 'core.email', 'Adresse électronique', 'Adresse de courrier électronique. Très fréquente et rarement sensible seule : c''est le nombre de valeurs DISTINCTES qui fait la fuite, pas la présence.', 'contact', 'regex', '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}\b', '[]', NULL, '[]', 0, 0, 0.85, 0, 0, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'bdfa598890ec49189f812e402011ac0e', 'core.phone', 'Numéro de téléphone', 'Numéro français (0X ou +33) ou international au format E.164. La forme est trop banale pour valoir seule : un mot-clé de proximité est exigé.', 'contact', 'regex', '(?:\+\d{1,3}[ .-]?)?\b0?\d(?:[ .-]?\d){7,12}\b', '[]', NULL, '["tél","tel","téléphone","telephone","portable","mobile","appeler","joindre","gsm","numéro","numero"]', 100, 1, 0.45, 0, 0.3, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'80d978b1e0ee4b118353d0a0a42a4350', 'core.ip', 'Adresse IP', 'Adresse IPv4 ou IPv6. Une adresse isolée n''est pas une fuite ; un export en contenant des centaines en est une — d''où le seuil de valeurs distinctes.', 'technical', 'regex', '\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b|\b(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}\b', '[]', NULL, '[]', 0, 0, 0.8, 0, 0, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'8c14534b6d1a49d599aa99f9fb31fd83', 'core.private_key', 'Clé privée SSH ou PGP', 'En-tête de bloc de clé privée (OpenSSH, RSA, EC, DSA, PGP). Une seule occurrence suffit : une clé privée qui sort est une compromission complète.', 'secret', 'regex', '-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY(?: BLOCK)?-----', '[]', NULL, '[]', 0, 0, 0.98, 0, 0, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'ae78406878024d6f8b575126b0b906dc', 'core.api_token', 'Jeton d''API', 'Jeton d''accès : secret interne Kubuno, jeton porteur JWT, clé d''API de forme courante, ou affectation explicite d''une clé.', 'secret', 'regex', '\bkbms1\.[a-z0-9_-]+\.[A-Za-z0-9_-]{20,}\b|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b|(?i:\b(?:api[_-]?key|api[_-]?token|secret[_-]?key|access[_-]?token)\b["'' :=]{1,4}[A-Za-z0-9_\-]{16,})', '[]', NULL, '[]', 0, 0, 0.9, 0, 0, 0.7, 1, 1, 1, 1, NULL, NULL);
INSERT INTO "core"."content_detectors" ("id", "key", "label", "description", "category", "kind", "pattern", "terms", "checksum", "proximity_terms", "proximity_window", "proximity_required", "base_confidence", "checksum_bonus", "proximity_bonus", "min_confidence", "min_matches", "min_unique_matches", "is_enabled", "is_builtin", "created_by", "updated_by") VALUES (X'aee98d3dffd2426093307157171e6a18', 'core.password', 'Mot de passe en clair', 'Un mot de passe annoncé puis écrit. La forme seule ne vaut rien — c''est le signe adjacent (« : », « = », « est ») qui fait la détection, d''où la proximité obligatoire.', 'secret', 'wordlist', NULL, '["mot de passe","mots de passe","motdepasse","password","passwd","mdp","pwd","passphrase"]', NULL, '[":","=","est ","sera ","voici","temporaire","provisoire","initial"]', 40, 1, 0.4, 0, 0.4, 0.7, 1, 1, 1, 1, NULL, NULL);

-- ── updated_at refresh (the plpgsql BEFORE-UPDATE trigger, per engine) ────────
-- PostgreSQL refreshes `updated_at` with `core.set_updated_at()`; MySQL with an
-- `ON UPDATE CURRENT_TIMESTAMP` column clause. SQLite has neither, so one
-- AFTER-UPDATE trigger per table stamps the row. The `WHEN NEW.updated_at =
-- OLD.updated_at` guard makes it idempotent (its own write does not re-fire it,
-- recursive_triggers on or off) and lets a statement that sets `updated_at`
-- itself win. The row is found by `rowid` (every table here is a rowid table),
-- so it works whatever the primary key is.
CREATE TRIGGER "core"."acme_state_set_updated_at" AFTER UPDATE ON "acme_state"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."acme_state" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."alerts_set_updated_at" AFTER UPDATE ON "alerts"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."alerts" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."buildings_set_updated_at" AFTER UPDATE ON "buildings"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."buildings" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."clipboard_items_set_updated_at" AFTER UPDATE ON "clipboard_items"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."clipboard_items" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."collab_snapshots_set_updated_at" AFTER UPDATE ON "collab_snapshots"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."collab_snapshots" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."content_detectors_set_updated_at" AFTER UPDATE ON "content_detectors"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."content_detectors" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."domains_set_updated_at" AFTER UPDATE ON "domains"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."domains" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."holiday_calendars_set_updated_at" AFTER UPDATE ON "holiday_calendars"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."holiday_calendars" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."holiday_unit_prefs_set_updated_at" AFTER UPDATE ON "holiday_unit_prefs"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."holiday_unit_prefs" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."holidays_set_updated_at" AFTER UPDATE ON "holidays"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."holidays" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."labels_set_updated_at" AFTER UPDATE ON "labels"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."labels" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."ldap_directories_set_updated_at" AFTER UPDATE ON "ldap_directories"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."ldap_directories" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."login_captcha_gate_set_updated_at" AFTER UPDATE ON "login_captcha_gate"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."login_captcha_gate" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."login_throttle_set_updated_at" AFTER UPDATE ON "login_throttle"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."login_throttle" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."migration_accounts_set_updated_at" AFTER UPDATE ON "migration_accounts"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."migration_accounts" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."module_usage_daily_set_updated_at" AFTER UPDATE ON "module_usage_daily"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."module_usage_daily" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."modules_set_updated_at" AFTER UPDATE ON "modules"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."modules" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."oauth_providers_set_updated_at" AFTER UPDATE ON "oauth_providers"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."oauth_providers" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."org_units_set_updated_at" AFTER UPDATE ON "org_units"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."org_units" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."privileges_set_updated_at" AFTER UPDATE ON "privileges"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."privileges" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."remote_mounts_set_updated_at" AFTER UPDATE ON "remote_mounts"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."remote_mounts" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."resource_features_set_updated_at" AFTER UPDATE ON "resource_features"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."resource_features" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."resources_set_updated_at" AFTER UPDATE ON "resources"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."resources" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."roles_set_updated_at" AFTER UPDATE ON "roles"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."roles" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."rule_actions_set_updated_at" AFTER UPDATE ON "rule_actions"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."rule_actions" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."rule_triggers_set_updated_at" AFTER UPDATE ON "rule_triggers"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."rule_triggers" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."rules_set_updated_at" AFTER UPDATE ON "rules"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."rules" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."setting_values_set_updated_at" AFTER UPDATE ON "setting_values"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."setting_values" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."settings_set_updated_at" AFTER UPDATE ON "settings"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."settings" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."target_audiences_set_updated_at" AFTER UPDATE ON "target_audiences"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."target_audiences" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."user_groups_set_updated_at" AFTER UPDATE ON "user_groups"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."user_groups" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
CREATE TRIGGER "core"."users_set_updated_at" AFTER UPDATE ON "users"
    FOR EACH ROW WHEN NEW."updated_at" = OLD."updated_at"
    BEGIN
        UPDATE "core"."users" SET "updated_at" = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE rowid = NEW.rowid;
    END;
