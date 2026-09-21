-- Organizational units: a tree of units, with users placed in one unit.
CREATE TABLE core.org_units (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    parent_id  UUID REFERENCES core.org_units(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_ou_parent ON core.org_units(parent_id);

CREATE TRIGGER org_units_updated_at BEFORE UPDATE ON core.org_units
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- A single root unit, named after the instance (fallback "Organisation").
INSERT INTO core.org_units (name, parent_id)
VALUES (COALESCE((SELECT value #>> '{}' FROM core.settings WHERE key = 'instance.name'), 'Organisation'), NULL);

-- Place every existing user at the root unit.
ALTER TABLE core.users ADD COLUMN org_unit_id UUID REFERENCES core.org_units(id) ON DELETE SET NULL;
UPDATE core.users SET org_unit_id = (SELECT id FROM core.org_units WHERE parent_id IS NULL ORDER BY created_at LIMIT 1);
CREATE INDEX idx_core_users_ou ON core.users(org_unit_id);
