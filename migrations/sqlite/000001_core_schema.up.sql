-- SQLite — consolidated `core` schema, the FINAL shape the PostgreSQL
-- migrations 000001..000138 reach. `core` is an ATTACHed database file;
-- tables and indexes are qualified `core.`, foreign-key REFERENCES are
-- unqualified (same database), and kubuno-db enables PRAGMA foreign_keys.
--
-- Type/behaviour mapping: UUID -> BLOB, TIMESTAMPTZ -> TEXT (UTC), JSONB/
-- JSON and TEXT[] list columns -> TEXT holding JSON, BOOLEAN -> INTEGER,
-- BIGSERIAL -> INTEGER PRIMARY KEY AUTOINCREMENT. plpgsql triggers and the
-- conditional UNIQUE indexes are enforced in Rust (updated_at too); plain
-- partial indexes are flattened. tsvector/GIN search -> ILIKE per engine.

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

