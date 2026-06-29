-- Declarative per-module settings schema.
--
-- Modules now declare their settings via a manifest pushed at registration
-- (core.modules.config.settings_schema). The core seeds the instance-level rows
-- (scope 'global' and 'overridable') into core.settings so the admin can edit
-- them through the existing /admin/settings surface, and resolves the effective
-- value for each user (override ?? global default) on its own.
--
-- These columns turn core.settings into a self-describing registry: each row
-- knows its scope, its value type, its enum domain, its owning module and its
-- factory default.

ALTER TABLE core.settings
    ADD COLUMN IF NOT EXISTS scope          VARCHAR(20)  NOT NULL DEFAULT 'global'
        CHECK (scope IN ('global', 'user', 'overridable')),
    ADD COLUMN IF NOT EXISTS value_type     VARCHAR(20),  -- bool | int | string | enum
    ADD COLUMN IF NOT EXISTS allowed_values JSONB,        -- enum domain, e.g. ["month","week"]
    ADD COLUMN IF NOT EXISTS module_id      VARCHAR(100), -- owning module (NULL for core settings)
    ADD COLUMN IF NOT EXISTS default_value  JSONB;        -- factory default (for "reset")

CREATE INDEX IF NOT EXISTS idx_core_settings_module ON core.settings(module_id);
