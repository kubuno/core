-- Groupes d'utilisateurs et leurs permissions.
-- Séparés des rôles système (user/admin/guest) pour une granularité fine.

CREATE TABLE core.user_groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    -- Permissions accordées aux membres de ce groupe.
    -- Format : tableau JSON de clés de permission.
    -- Ex : ["api_tokens.create", "files.upload_large", "admin.view_logs"]
    permissions JSONB NOT NULL DEFAULT '[]',
    -- Si TRUE, tout nouvel utilisateur est automatiquement ajouté à ce groupe.
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_groups_updated_at
    BEFORE UPDATE ON core.user_groups
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TABLE core.user_group_members (
    group_id   UUID NOT NULL REFERENCES core.user_groups(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by   UUID REFERENCES core.users(id) ON DELETE SET NULL,
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_core_ugm_user  ON core.user_group_members(user_id);
CREATE INDEX idx_core_ugm_group ON core.user_group_members(group_id);

-- Groupe par défaut : tous les utilisateurs standard
INSERT INTO core.user_groups (name, description, permissions, is_default) VALUES
    ('Utilisateurs', 'Groupe de base — tous les nouveaux utilisateurs', '["api_tokens.create"]', TRUE),
    ('Invités',      'Accès minimal, aucune action avancée',            '[]',                   FALSE);
