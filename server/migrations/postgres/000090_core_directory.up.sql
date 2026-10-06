-- LDAP / Active Directory: connected directories, and the marks a directory
-- leaves on the accounts and groups it governs.
--
-- ── Why a table rather than settings keys ────────────────────────────────────
-- An instance can be joined to more than one directory (a merger, a subsidiary,
-- a contractor forest). Everything below is therefore per-directory, exactly
-- like `core.oauth_providers`, and the two share their shape on purpose: an
-- operator who has configured one recognises the other.
--
-- ── The service-account password ────────────────────────────────────────────
-- `bind_password_enc` holds an AES-256-GCM blob, keyed by a domain-separated
-- derivation of the JWT secret — the same construction the SMTP relay and the
-- OIDC client secrets use (`crate::directory::config::secret_key`). It goes in
-- once over the authenticated admin channel and never comes back out: the API
-- reports a boolean.
--
-- ── What a directory may do to an account ───────────────────────────────────
-- `on_missing` is deliberately limited to 'disable' and 'ignore'. Deleting is
-- not an option the schema can express, because a deletion is irreversible and
-- a directory that answers "no entries" during a network incident would empty
-- the instance. The synchroniser adds a second guard on top of this one
-- (`crate::directory::sync::disable_guard`).

CREATE TABLE core.ldap_directories (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Short stable handle. Appears in logs, audit entries and job payloads —
    -- never in a public URL: a directory is not an interactive sign-in button.
    slug              VARCHAR(40)  UNIQUE NOT NULL,
    display_name      VARCHAR(255) NOT NULL,
    enabled           BOOLEAN      NOT NULL DEFAULT FALSE,

    -- ── Connection ───────────────────────────────────────────────────────────
    host              VARCHAR(255) NOT NULL,
    port              INTEGER      NOT NULL DEFAULT 389 CHECK (port BETWEEN 1 AND 65535),
    -- 'none'     — plain LDAP, only reasonable on a loopback or a trusted link
    -- 'starttls' — connect in clear on 389, upgrade with the StartTLS exop
    -- 'ldaps'    — TLS from the first byte (636)
    security          VARCHAR(16)  NOT NULL DEFAULT 'starttls'
                          CHECK (security IN ('none', 'starttls', 'ldaps')),
    -- Verifying the server certificate is the default and turning it off is an
    -- explicit act. `ca_certificate` is the answer an internal directory
    -- actually needs: a private authority, pasted as PEM, rather than trust
    -- switched off wholesale.
    verify_certificate BOOLEAN     NOT NULL DEFAULT TRUE,
    ca_certificate     TEXT        NOT NULL DEFAULT '',
    connect_timeout_s  INTEGER     NOT NULL DEFAULT 10 CHECK (connect_timeout_s BETWEEN 1 AND 120),

    -- ── Service account ──────────────────────────────────────────────────────
    -- Empty `bind_dn` means an anonymous bind for the search phase. Some
    -- directories allow it; Active Directory does not.
    bind_dn           VARCHAR(500) NOT NULL DEFAULT '',
    bind_password_enc TEXT         NOT NULL DEFAULT '',

    -- ── Finding people ───────────────────────────────────────────────────────
    base_dn           VARCHAR(500) NOT NULL,
    -- `{login}` is substituted with the RFC 4515-escaped value typed at sign-in.
    user_filter       VARCHAR(500) NOT NULL DEFAULT '(&(objectClass=inetOrgPerson)(uid={login}))',
    user_scope        VARCHAR(16)  NOT NULL DEFAULT 'subtree'
                          CHECK (user_scope IN ('base', 'onelevel', 'subtree')),

    -- ── Attribute mapping ────────────────────────────────────────────────────
    -- Defaults are the standard-directory ones (inetOrgPerson). The console
    -- offers an Active Directory preset, whose names differ on every line.
    attr_username     VARCHAR(64)  NOT NULL DEFAULT 'uid',
    attr_email        VARCHAR(64)  NOT NULL DEFAULT 'mail',
    attr_display_name VARCHAR(64)  NOT NULL DEFAULT 'cn',
    -- Immutable identifier. This is what survives a rename or a move in the
    -- tree; matching on the DN alone loses the account the day somebody is
    -- promoted into another organisational unit.
    attr_unique_id    VARCHAR(64)  NOT NULL DEFAULT 'entryUUID',
    -- Group membership read from the person's own entry (AD's `memberOf`).
    -- Empty = do not read it; the group search below is used instead.
    attr_member_of    VARCHAR(64)  NOT NULL DEFAULT '',

    -- ── Groups ───────────────────────────────────────────────────────────────
    sync_groups       BOOLEAN      NOT NULL DEFAULT FALSE,
    group_base_dn     VARCHAR(500) NOT NULL DEFAULT '',
    group_filter      VARCHAR(500) NOT NULL DEFAULT '(objectClass=groupOfNames)',
    attr_group_name   VARCHAR(64)  NOT NULL DEFAULT 'cn',
    attr_group_member VARCHAR(64)  NOT NULL DEFAULT 'member',

    -- ── Synchronisation ──────────────────────────────────────────────────────
    sync_enabled      BOOLEAN      NOT NULL DEFAULT FALSE,
    sync_interval_min INTEGER      NOT NULL DEFAULT 60
                          CHECK (sync_interval_min BETWEEN 5 AND 10080),
    -- What happens to an account the directory no longer returns. There is no
    -- 'delete': see the header.
    on_missing        VARCHAR(16)  NOT NULL DEFAULT 'disable'
                          CHECK (on_missing IN ('disable', 'ignore')),
    -- Provision an account on a successful sign-in by somebody the instance has
    -- never seen. Off means the directory authenticates only people an operator
    -- (or a synchronisation) already imported.
    allow_signup      BOOLEAN      NOT NULL DEFAULT TRUE,

    -- ── Last run, for the console ────────────────────────────────────────────
    last_sync_at      TIMESTAMPTZ,
    last_sync_status  VARCHAR(16) CHECK (last_sync_status IN ('ok', 'partial', 'failed')),
    -- Human-readable summary of the last run, truncated by the application.
    -- Never holds a credential: the synchroniser redacts before writing.
    last_sync_detail  TEXT,

    position          INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_core_ldap_enabled ON core.ldap_directories(enabled) WHERE enabled = TRUE;

CREATE TRIGGER ldap_directories_updated_at BEFORE UPDATE ON core.ldap_directories
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── The mark a directory leaves on an account ───────────────────────────────
--
-- Three columns rather than a reuse of `oauth_provider`: the OIDC callback
-- queries that pair, and overloading it with `ldap:<slug>` would make one
-- subsystem's lookup silently traverse another's rows.
ALTER TABLE core.users
    ADD COLUMN ldap_directory_id UUID REFERENCES core.ldap_directories(id) ON DELETE SET NULL,
    -- Distinguished name, kept for display and for the group-membership join.
    ADD COLUMN ldap_dn           VARCHAR(1000),
    -- The immutable identifier read through `attr_unique_id`. This, not the DN,
    -- is what re-identifies somebody after a rename.
    ADD COLUMN ldap_uid          VARCHAR(255),
    ADD COLUMN ldap_synced_at    TIMESTAMPTZ;

CREATE INDEX idx_core_users_ldap ON core.users(ldap_directory_id) WHERE ldap_directory_id IS NOT NULL;
CREATE UNIQUE INDEX idx_core_users_ldap_uid
    ON core.users(ldap_directory_id, ldap_uid)
    WHERE ldap_directory_id IS NOT NULL AND ldap_uid IS NOT NULL;

-- An account provisioned by a directory has neither a password hash nor an
-- OIDC subject — the directory is its authority. The original constraint of
-- migration 000001 would refuse it, so it is widened by exactly two cases and
-- by nothing else.
--
-- The second case is `is_active = FALSE`, and it is what makes detaching a
-- directory possible without deleting anybody: `ldap_directory_id` is
-- `ON DELETE SET NULL`, so removing a directory would leave its accounts with
-- no authenticator at all and the constraint would refuse the deletion
-- outright. A deactivated account cannot sign in by any route, so requiring it
-- to name an authenticator states nothing. The delete path deactivates them
-- first, on purpose and visibly (`handlers::admin::ldap::delete_directory`).
ALTER TABLE core.users DROP CONSTRAINT IF EXISTS password_or_oauth;
ALTER TABLE core.users ADD CONSTRAINT password_or_external
    CHECK (password_hash IS NOT NULL
        OR oauth_provider IS NOT NULL
        OR ldap_directory_id IS NOT NULL
        OR is_active = FALSE);

-- ── Imported groups ─────────────────────────────────────────────────────────
ALTER TABLE core.user_groups
    ADD COLUMN ldap_directory_id UUID REFERENCES core.ldap_directories(id) ON DELETE SET NULL,
    ADD COLUMN ldap_dn           VARCHAR(1000);

CREATE UNIQUE INDEX idx_core_groups_ldap_dn
    ON core.user_groups(ldap_directory_id, ldap_dn)
    WHERE ldap_directory_id IS NOT NULL;

-- Who put this person in this group. `directory` covers every EXTERNAL identity
-- source — an LDAP synchronisation and an OIDC `groups` claim alike — because
-- the rule they share is the one that matters: an import may only remove what
-- an import added. An operator's manual membership survives every run, and
-- survives detaching the source altogether.
ALTER TABLE core.user_group_members
    ADD COLUMN source VARCHAR(16) NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'directory'));

CREATE INDEX idx_core_ugm_source ON core.user_group_members(source) WHERE source = 'directory';

-- ── OIDC: the same two gaps, on the provider that already existed ───────────
--
-- `core.oauth_providers` mapped four claims by name, in Rust, with no way to
-- change them: `preferred_username`, `email`, `name`, `sub`. That is the
-- OpenID Connect standard set and roughly nobody ships it unchanged — Okta puts
-- the handle in `login`, an Azure tenant in `upn`, a home-grown provider
-- wherever its author felt like. The mapping becomes configuration, with the
-- standard names as the defaults, exactly like the directory above.
--
-- `claim_groups` closes the other gap: an identity provider that already knows
-- which groups somebody belongs to had no way to say so.
ALTER TABLE core.oauth_providers
    ADD COLUMN claim_username     VARCHAR(64) NOT NULL DEFAULT 'preferred_username',
    ADD COLUMN claim_email        VARCHAR(64) NOT NULL DEFAULT 'email',
    ADD COLUMN claim_display_name VARCHAR(64) NOT NULL DEFAULT 'name',
    ADD COLUMN claim_groups       VARCHAR(64) NOT NULL DEFAULT 'groups',
    -- Import the groups named by `claim_groups` and place the person in them.
    -- Off by default: turning it on lets the identity provider decide group
    -- membership on this instance, which is a delegation an operator makes on
    -- purpose.
    ADD COLUMN sync_groups        BOOLEAN     NOT NULL DEFAULT FALSE;

-- Groups created from an OIDC claim, so a run only ever removes what it added
-- (same discipline as `user_group_members.source` above).
ALTER TABLE core.user_groups
    ADD COLUMN oauth_provider_slug VARCHAR(40);

CREATE UNIQUE INDEX idx_core_groups_oauth
    ON core.user_groups(oauth_provider_slug, name)
    WHERE oauth_provider_slug IS NOT NULL;

-- ── Instance-level policy ───────────────────────────────────────────────────
-- Two keys, both enforced in `crate::directory`:
--   * the master switch is the lever an operator pulls when a directory starts
--     misbehaving, without editing every directory row;
--   * provisioning on first sign-in is the instance default a directory may
--     narrow (`ldap_directories.allow_signup`) but never widen.
-- ── Which methods an account may use, PER ORGANISATIONAL UNIT ───────────────
--
-- The method is an administrator's decision, not a heuristic, and organisations
-- are not uniform: a subsidiary on its own directory, a support desk on local
-- accounts, headquarters on the identity provider. `auth.methods` is therefore
-- a scoped setting (migration 000060): a value on a unit descends to its
-- sub-units, the nearest unit wins, a level above can lock it, and reverting
-- removes the row so the branch follows its parent again.
--
-- An account with no unit resolves to the instance value and nothing else —
-- `core.setting_chain` anchors on `core.users.org_unit_id`, which is NULL for
-- them, so their chain is `default → instance`. No special case needed.
--
-- `default_value` is every method, so an instance that never touches this key
-- behaves exactly as it did before it existed.
--
-- ⚠️ These two keys are NOT writable through the generic settings route without
-- passing the anti-lockout guard (`crate::auth::methods`): a policy that leaves
-- an administrator with no usable method is refused, per administrator, in the
-- same transaction that would have written it.
INSERT INTO core.settings (key, value, category, label, description, is_public, scope, default_value) VALUES
    ('auth.methods', '["local","directory","sso"]', 'auth',
     'Méthodes d''authentification acceptées',
     'Ce qu''une personne rattachée à cette portée a le droit d''utiliser pour se connecter : mot de passe local, annuaire LDAP / Active Directory, fournisseur SSO. Se pose par unité organisationnelle et descend aux sous-unités ; l''unité la plus proche l''emporte.',
     FALSE, 'overridable', '["local","directory","sso"]'),
    ('auth.local_admin_fallback', 'true', 'auth',
     'Secours local des administrateurs',
     'Un administrateur peut toujours utiliser son mot de passe local, même là où « local » ne figure pas parmi les méthodes acceptées. C''est la voie qui empêche une politique erronée de devenir une porte close. La désactiver est refusé si cela laissait un administrateur sans méthode utilisable.',
     FALSE, 'overridable', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('auth.directory_login_enabled', 'true', 'auth',
     'Authentification par annuaire activée',
     'Interrupteur général des annuaires LDAP / Active Directory. Désactivé, plus aucune tentative de connexion n''interroge un annuaire ; les comptes locaux ne sont pas affectés.',
     FALSE),
    ('auth.directory_provision_on_login', 'true', 'auth',
     'Créer les comptes à la première connexion par annuaire',
     'Une personne présente dans l''annuaire mais inconnue de l''instance obtient un compte lors de sa première connexion réussie. Désactivé, seule la synchronisation crée des comptes.',
     FALSE)
ON CONFLICT (key) DO NOTHING;
