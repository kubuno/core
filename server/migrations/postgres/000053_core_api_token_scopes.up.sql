-- Personal API tokens: scopes, and the migration of the ones already issued.
--
-- Until now `core.api_tokens` carried a name, a hash and an optional expiry —
-- nothing else. `AuthUser` accepted such a token wherever it accepted a signed
-- session, resolved it to the owning account and returned the very same `User`.
-- A token minted by an administrator was therefore a **complete, permanent
-- administration key that bypassed the second factor**: it inherited every
-- privilege of its owner, it never had to expire, and no step-up challenge could
-- ever be put to it because there is nobody at the keyboard to answer one.
--
-- This migration gives the table the three columns that make a token a *narrower*
-- credential than its owner:
--
--   scopes        the privilege keys the bearer may exercise. The effective
--                 privilege is the INTERSECTION of this list with what the owner
--                 holds at the moment of the call — never a frozen copy, so a
--                 privilege withdrawn from the owner is withdrawn from the token.
--   is_legacy     issued before scopes existed. Kept working for a while rather
--                 than broken outright (see the grace window below), but never
--                 for an administrative write.
--   legacy_since  when the token was marked legacy. The deadline is computed as
--                 `legacy_since + security.api_token_legacy_grace_days`, read at
--                 each call, so an operator can widen or close the window from
--                 the settings without a second migration.
--
-- The CHECK is what makes "no default of everything" structural: a row that is
-- not legacy must carry at least one scope, so an INSERT that forgets them fails
-- in the database rather than quietly minting an unrestricted credential.

ALTER TABLE core.api_tokens
    ADD COLUMN scopes       TEXT[]      NOT NULL DEFAULT '{}',
    ADD COLUMN is_legacy    BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN legacy_since TIMESTAMPTZ;

-- Every token that exists today predates scopes. Marked in one statement,
-- *before* the constraint below is armed — including the revoked ones, so that a
-- row un-revoked by hand can never come back as an unscoped credential.
UPDATE core.api_tokens
   SET is_legacy    = TRUE,
       legacy_since = NOW()
 WHERE cardinality(scopes) = 0;

ALTER TABLE core.api_tokens
    ADD CONSTRAINT api_tokens_scoped_or_legacy
    CHECK (is_legacy OR cardinality(scopes) > 0);

ALTER TABLE core.api_tokens
    ADD CONSTRAINT api_tokens_legacy_has_since
    CHECK (NOT is_legacy OR legacy_since IS NOT NULL);

CREATE INDEX idx_core_api_tokens_scopes ON core.api_tokens USING GIN (scopes);
CREATE INDEX idx_core_api_tokens_legacy ON core.api_tokens(is_legacy)
    WHERE is_legacy AND revoked_at IS NULL;

COMMENT ON COLUMN core.api_tokens.scopes IS
    'Privilege keys the bearer may exercise. Effective privilege = intersection with the owner''s, re-evaluated at every call.';
COMMENT ON COLUMN core.api_tokens.is_legacy IS
    'Issued before scopes existed: runs on the owner''s privileges during the grace window, never for an administrative write.';


-- ── Which privileges a token may never carry ────────────────────────────────
--
-- Some operations hand over durable control of the instance, and every one of
-- them is guarded by an interactive re-authentication that a program simply
-- cannot satisfy: there is no second factor behind a bearer token and no human
-- to prompt. Letting such a key be *named* in a token's scope list would be a
-- promise the rest of the system then has to refuse anyway — better to refuse it
-- at the point where the token is minted.
--
-- The flag lives on the catalogue rather than in a hard-coded list so that a
-- module declaring its own privileges can mark its dangerous ones the same way.
ALTER TABLE core.privileges
    ADD COLUMN is_token_grantable BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN core.privileges.is_token_grantable IS
    'FALSE = may never appear in an API token''s scopes: requires interactive re-authentication.';

UPDATE core.privileges
   SET is_token_grantable = FALSE
 WHERE key IN (
        'core.roles.manage',        -- granting power is how delegation becomes escalation
        'core.marketplace.manage',  -- installing a module runs new code on the host
        'core.themes.manage'        -- approving a theme ships assets to every browser
   );

-- Resetting a second factor is the fourth of the operations reserved to a
-- person. It has no administrative privilege key: the routes that do it
-- (`DELETE /me/2fa`, `POST /me/2fa/backup-codes`) are self-service and already
-- take the `Reauthenticated` extractor, which refuses an API token outright with
-- REAUTH_NOT_AVAILABLE. It is therefore closed structurally rather than by a
-- flag, and `auth::token_scope::policy` refuses the whole `security.*` namespace
-- as scopes so that adding such a key later cannot open it by accident.


-- ── Two privileges the scoping model needs to exist ─────────────────────────
--
-- Both describe something a token can do that was previously implied by "the
-- bearer simply is its owner". Naming them is what lets a token be granted one
-- without the other.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable, is_token_grantable) VALUES
    ('core.module_admin.execute', 'core', 'module_admin', 'execute',
     'Agir en administrateur auprès des modules',
     'Autorise le porteur à être présenté aux modules avec le rôle « admin » (en-tête X-Kubuno-User-Role). Sans cette portée, un jeton est toujours présenté comme un utilisateur ordinaire, quel que soit le rôle de son propriétaire.',
     FALSE, TRUE),
    ('core.mcp.execute', 'core', 'mcp', 'execute',
     'Utiliser le serveur MCP',
     'Autorise le porteur à appeler /mcp et à exécuter les outils exposés par les modules. Cette route s''authentifie uniquement par jeton d''API.',
     FALSE, TRUE)
ON CONFLICT (key) DO NOTHING;


-- ── Policy knobs ────────────────────────────────────────────────────────────
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('security.api_token_max_ttl_days', '365', 'security',
     'Durée de vie maximale d''un jeton d''API (jours)',
     'Plafond appliqué à la création. Un jeton portant une portée « core.* » en écriture ne peut jamais être sans expiration.',
     FALSE),
    ('security.api_token_legacy_grace_days', '90', 'security',
     'Fenêtre de grâce des jetons d''API hérités (jours)',
     'Délai, à compter du marquage, pendant lequel un jeton émis avant les portées continue de fonctionner. Les écritures d''administration sont refusées immédiatement, sans grâce.',
     FALSE)
ON CONFLICT (key) DO NOTHING;
