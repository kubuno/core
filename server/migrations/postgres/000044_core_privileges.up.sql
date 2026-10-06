-- Delegated administration: privilege catalogue, roles, assignments.
--
-- Until now the only elevated state in the system was `core.users.role = 'admin'`
-- — all or nothing. `core.org_units` existed with `core.users.org_unit_id`, but
-- carried no authorisation meaning whatsoever: nothing could express "this
-- person administers *this* branch of the organisation and nothing else".
--
-- Three objects, deliberately distinct:
--
--   core.privileges        the catalogue. One row per capability, named
--                          `<space>.<domain>.<verb>`. `core` is reserved and
--                          seeded here; a module may only declare under its own
--                          identifier, and the core prefixes it by force at
--                          registration (same mechanism as `settings_schema`).
--
--   core.roles             a named bag of privileges. Nothing else — a role
--                          knows no subject and no scope.
--
--   core.role_assignments  subject × role × scope. Separating this from the role
--                          is what makes delegation possible at all: the same
--                          "user administrator" role is granted to Alice over
--                          the whole instance and to Bob over one unit only.
--
-- ── The scopability rule ─────────────────────────────────────────────────────
-- `is_ou_scopable` says whether a privilege *can* be confined to a subtree of
-- the organisational tree. Some cannot, by nature: a role is instance-wide, a
-- setting is instance-wide, a group crosses units, the audit trail records the
-- whole instance. The application refuses an org-unit-scoped assignment whose
-- role contains **even one** non-scopable privilege (see `crate::authz`).
-- Without that rule the scope is decoration: an operator "restricted" to a unit
-- would still hold instance-wide power through the non-scopable privilege, and
-- the restriction would be a false sense of security rather than a boundary.
--
-- ── Orphans ─────────────────────────────────────────────────────────────────
-- A privilege whose module is uninstalled is **kept and flagged**, never
-- deleted. Deleting it would either cascade-empty the roles that reference it
-- (silent privilege loss, or worse, silent privilege *change*) or leave audit
-- entries pointing at a key nobody can interpret. `is_orphan` is a display
-- concern; the row stays.

-- ── Catalogue ────────────────────────────────────────────────────────────────
CREATE TABLE core.privileges (
    -- `<space>.<domain>.<verb>`, exactly three segments.
    key            VARCHAR(160) PRIMARY KEY,
    -- 'core' or a module identifier. Enforced by the application at
    -- registration; a module can never write outside its own namespace.
    namespace      VARCHAR(100) NOT NULL,
    domain         VARCHAR(60)  NOT NULL,
    verb           VARCHAR(20)  NOT NULL
                       CHECK (verb IN ('read', 'create', 'update', 'delete', 'manage', 'execute')),
    label          VARCHAR(255) NOT NULL,
    description    TEXT,
    -- May this privilege be confined to an organisational subtree?
    is_ou_scopable BOOLEAN NOT NULL DEFAULT FALSE,
    -- The declaring module is gone. Kept for readability of roles and audit.
    is_orphan      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT privilege_key_shape CHECK (key = namespace || '.' || domain || '.' || verb)
);
CREATE INDEX idx_core_priv_namespace ON core.privileges(namespace);
CREATE INDEX idx_core_priv_scopable  ON core.privileges(is_ou_scopable);

CREATE TRIGGER privileges_updated_at BEFORE UPDATE ON core.privileges
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── Roles ────────────────────────────────────────────────────────────────────
CREATE TABLE core.roles (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug          VARCHAR(100) UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    -- Seeded by the core, not deletable.
    is_system     BOOLEAN NOT NULL DEFAULT FALSE,
    -- Holds every privilege implicitly, present and future. Exactly one such
    -- role is seeded; the flag is not settable through the API.
    is_superuser  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER roles_updated_at BEFORE UPDATE ON core.roles
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TABLE core.role_privileges (
    role_id       UUID         NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
    -- ON DELETE RESTRICT, not CASCADE: a privilege is never deleted (it becomes
    -- an orphan instead), and this constraint is the last line that says so.
    privilege_key VARCHAR(160) NOT NULL REFERENCES core.privileges(key) ON DELETE RESTRICT,
    PRIMARY KEY (role_id, privilege_key)
);
CREATE INDEX idx_core_role_priv_key ON core.role_privileges(privilege_key);

-- ── Assignments ──────────────────────────────────────────────────────────────
CREATE TABLE core.role_assignments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id           UUID NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,

    -- Subject: a user OR a group, never both, never neither.
    subject_user_id   UUID REFERENCES core.users(id)       ON DELETE CASCADE,
    subject_group_id  UUID REFERENCES core.user_groups(id) ON DELETE CASCADE,

    scope             VARCHAR(16) NOT NULL CHECK (scope IN ('instance', 'org_unit')),
    -- The subtree root when scope = 'org_unit'. The assignment covers the unit
    -- and all its descendants (see core.org_unit_descendants, migration 000041).
    scope_org_unit_id UUID REFERENCES core.org_units(id) ON DELETE CASCADE,

    -- Temporary delegation ("cover for me for two weeks"). NULL = permanent.
    expires_at        TIMESTAMPTZ,

    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by        UUID REFERENCES core.users(id) ON DELETE SET NULL,

    CONSTRAINT assignment_one_subject CHECK (
        (subject_user_id IS NOT NULL) <> (subject_group_id IS NOT NULL)
    ),
    CONSTRAINT assignment_scope_coherent CHECK (
        (scope = 'org_unit') = (scope_org_unit_id IS NOT NULL)
    )
);

-- One assignment per (subject, role, scope). Two partial unique indexes because
-- NULL never equals NULL in a plain UNIQUE.
CREATE UNIQUE INDEX uniq_core_assign_user ON core.role_assignments
    (subject_user_id, role_id, scope, COALESCE(scope_org_unit_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WHERE subject_user_id IS NOT NULL;
CREATE UNIQUE INDEX uniq_core_assign_group ON core.role_assignments
    (subject_group_id, role_id, scope, COALESCE(scope_org_unit_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WHERE subject_group_id IS NOT NULL;

CREATE INDEX idx_core_assign_user  ON core.role_assignments(subject_user_id);
CREATE INDEX idx_core_assign_group ON core.role_assignments(subject_group_id);
CREATE INDEX idx_core_assign_role  ON core.role_assignments(role_id);
CREATE INDEX idx_core_assign_unit  ON core.role_assignments(scope_org_unit_id);

-- ── Who is a super-administrator, right now ──────────────────────────────────
-- Used by the "never remove the last one" guard and by the `users.role` cache
-- sync. Counts only ACTIVE accounts holding an instance-scoped superuser role,
-- directly or through a group, whose assignment has not expired.
CREATE OR REPLACE FUNCTION core.superadmin_ids()
RETURNS TABLE (user_id UUID)
LANGUAGE sql
STABLE
AS $$
    SELECT DISTINCT u.id
      FROM core.users u
      JOIN core.role_assignments a
        ON  a.subject_user_id = u.id
        OR  a.subject_group_id IN (
                SELECT m.group_id FROM core.user_group_members m WHERE m.user_id = u.id
            )
      JOIN core.roles r ON r.id = a.role_id
     WHERE u.is_active
       AND r.is_superuser
       AND a.scope = 'instance'
       AND (a.expires_at IS NULL OR a.expires_at > NOW());
$$;

COMMENT ON FUNCTION core.superadmin_ids() IS
    'Comptes actifs détenant un rôle super-utilisateur à portée instance (direct ou via un groupe), affectation non expirée.';

-- ── Seed: the core privilege catalogue ───────────────────────────────────────
-- Covers exactly what the administration surface does today. `is_ou_scopable`
-- is FALSE by default and TRUE only where confining the action to a subtree is
-- actually meaningful AND enforceable.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable) VALUES
    -- Accounts. Every one of these acts on a user, and a user belongs to a unit,
    -- so the subtree is a real boundary.
    ('core.users.read',              'core', 'users',            'read',    'Consulter les comptes',                 'Lister et afficher les comptes utilisateurs.', TRUE),
    ('core.users.create',            'core', 'users',            'create',  'Créer des comptes',                     'Créer un compte utilisateur.', TRUE),
    ('core.users.update',            'core', 'users',            'update',  'Modifier des comptes',                  'Modifier profil, quota et unité d''un compte.', TRUE),
    ('core.users.delete',            'core', 'users',            'delete',  'Supprimer des comptes',                 'Désactiver définitivement un compte.', TRUE),
    ('core.user_suspension.execute', 'core', 'user_suspension',  'execute', 'Suspendre / réactiver un compte',       'Basculer l''état actif d''un compte.', TRUE),
    ('core.user_password.execute',   'core', 'user_password',    'execute', 'Réinitialiser un mot de passe',         'Définir un nouveau mot de passe et révoquer les sessions du compte.', TRUE),
    ('core.sessions.read',           'core', 'sessions',         'read',    'Consulter les sessions',                'Lister les sessions actives d''un compte.', TRUE),
    ('core.sessions.delete',         'core', 'sessions',         'delete',  'Révoquer des sessions',                 'Révoquer une session ou toutes les sessions d''un compte.', TRUE),

    -- Organisational tree. Reading is scopable; restructuring is not: moving a
    -- unit changes the tree beyond the subtree it started in.
    ('core.org_units.read',          'core', 'org_units',        'read',    'Consulter les unités',                  'Lister les unités organisationnelles.', TRUE),
    ('core.org_units.manage',        'core', 'org_units',        'manage',  'Gérer les unités',                      'Créer, renommer, déplacer et supprimer des unités organisationnelles.', FALSE),

    -- Groups cross units by construction: never scopable.
    ('core.groups.read',             'core', 'groups',           'read',    'Consulter les groupes',                 'Lister les groupes et leurs membres.', FALSE),
    ('core.groups.manage',           'core', 'groups',           'manage',  'Gérer les groupes',                     'Créer, modifier, supprimer des groupes et leurs membres.', FALSE),

    -- Roles: instance-wide by nature, and the escalation surface itself.
    ('core.roles.read',              'core', 'roles',            'read',    'Consulter les rôles',                   'Lister les rôles, leurs privilèges et leurs affectations.', FALSE),
    ('core.roles.manage',            'core', 'roles',            'manage',  'Gérer les rôles',                       'Créer, modifier, supprimer des rôles et leurs affectations. Réservé aux super-utilisateurs.', FALSE),

    -- Instance configuration.
    ('core.settings.read',           'core', 'settings',         'read',    'Consulter les réglages',                'Lire les réglages de l''instance.', FALSE),
    ('core.settings.manage',         'core', 'settings',         'manage',  'Modifier les réglages',                 'Modifier les réglages de l''instance.', FALSE),
    ('core.stats.read',              'core', 'stats',            'read',    'Consulter le tableau de bord',          'Lire les statistiques agrégées de l''instance.', FALSE),

    -- Modules and marketplace: they run arbitrary code.
    ('core.modules.read',            'core', 'modules',          'read',    'Consulter les modules',                 'Lister les modules installés et leur état.', FALSE),
    ('core.modules.manage',          'core', 'modules',          'manage',  'Gérer les modules',                     'Activer et désactiver des modules.', FALSE),
    ('core.marketplace.manage',      'core', 'marketplace',      'manage',  'Installer des modules',                 'Parcourir la place de marché. L''installation reste réservée aux super-utilisateurs.', FALSE),

    -- Authentication providers, themes, mail relay.
    ('core.auth_providers.read',     'core', 'auth_providers',   'read',    'Consulter les fournisseurs d''identité', 'Lister les fournisseurs OAuth/OIDC.', FALSE),
    ('core.auth_providers.manage',   'core', 'auth_providers',   'manage',  'Gérer les fournisseurs d''identité',     'Créer, modifier, supprimer des fournisseurs OAuth/OIDC.', FALSE),
    ('core.themes.read',             'core', 'themes',           'read',    'Consulter les thèmes',                  'Lister les thèmes installés.', FALSE),
    ('core.themes.manage',           'core', 'themes',           'manage',  'Gérer les thèmes',                      'Créer et supprimer des thèmes. Import et approbation réservés aux super-utilisateurs.', FALSE),
    ('core.mail.read',               'core', 'mail',             'read',    'Consulter le relais de courriel',       'Lire la configuration SMTP sortante.', FALSE),
    ('core.mail.manage',             'core', 'mail',             'manage',  'Configurer le relais de courriel',      'Modifier la configuration SMTP et envoyer un message de test.', FALSE),

    -- Audit trail and API tokens: instance-wide readers.
    ('core.audit.read',              'core', 'audit',            'read',    'Consulter le journal d''audit',         'Lire, filtrer et exporter le journal d''administration.', FALSE),
    ('core.api_tokens.read',         'core', 'api_tokens',       'read',    'Consulter les jetons d''API',           'Lister les jetons d''API émis sur l''instance.', FALSE),
    ('core.api_tokens.manage',       'core', 'api_tokens',       'manage',  'Gérer les jetons d''API',               'Révoquer des jetons d''API.', FALSE);

-- ── Seed: system roles ───────────────────────────────────────────────────────
INSERT INTO core.roles (slug, name, description, is_system, is_superuser) VALUES
    ('super-admin',    'Super-administrateur',            'Détient tous les privilèges, présents et futurs. Seul habilité à gérer les rôles, installer des modules et approuver des thèmes.', TRUE, TRUE),
    ('user-admin',     'Administrateur des utilisateurs', 'Gère les comptes et leurs sessions. Tous ses privilèges sont restreignables : ce rôle peut être délégué sur une unité organisationnelle.',   TRUE, FALSE),
    ('read-only-admin','Administrateur en lecture seule', 'Consulte toute la console d''administration sans rien pouvoir modifier.',                                                                    TRUE, FALSE),
    ('service-admin',  'Administrateur des services',     'Gère les modules, les thèmes, les fournisseurs d''identité et le relais de courriel. Ne touche pas aux comptes.',                             TRUE, FALSE);

-- user-admin: scopable privileges only, so the role can be delegated on a unit.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, k
  FROM core.roles r,
       unnest(ARRAY[
           'core.users.read', 'core.users.create', 'core.users.update', 'core.users.delete',
           'core.user_suspension.execute', 'core.user_password.execute',
           'core.sessions.read', 'core.sessions.delete',
           'core.org_units.read'
       ]) AS k
 WHERE r.slug = 'user-admin';

-- read-only-admin: every `read` privilege of the catalogue. Contains
-- non-scopable ones (audit, settings…), so it is instance-only by the rule.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, p.key
  FROM core.roles r, core.privileges p
 WHERE r.slug = 'read-only-admin'
   AND p.namespace = 'core'
   AND p.verb = 'read';

-- service-admin: the operational surface, no account access.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, k
  FROM core.roles r,
       unnest(ARRAY[
           'core.modules.read', 'core.modules.manage', 'core.marketplace.manage',
           'core.themes.read', 'core.themes.manage',
           'core.auth_providers.read', 'core.auth_providers.manage',
           'core.mail.read', 'core.mail.manage',
           'core.settings.read', 'core.stats.read'
       ]) AS k
 WHERE r.slug = 'service-admin';

-- ── Migration of the existing state ──────────────────────────────────────────
-- Every account that is an administrator today receives an instance-scoped
-- super-administrator assignment. `core.users.role` is left EXACTLY as it is:
-- its CHECK is frozen, the module proxy forwards it in `X-Kubuno-User-Role` and
-- the frontend reads it. From here on it is a denormalised cache of "holds an
-- instance-scoped superuser role", kept in sync by the application.
INSERT INTO core.role_assignments (role_id, subject_user_id, scope)
SELECT r.id, u.id, 'instance'
  FROM core.users u, core.roles r
 WHERE u.role = 'admin'
   AND r.slug = 'super-admin'
ON CONFLICT DO NOTHING;
