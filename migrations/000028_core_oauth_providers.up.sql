-- Generic OIDC identity providers (Keycloak, GitLab, Authentik, Okta…), each
-- configured from the admin console. The client secret is stored AES-256-GCM
-- encrypted (key derived from the JWT secret) and never returned by the API.
CREATE TABLE core.oauth_providers (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug              VARCHAR(40)  UNIQUE NOT NULL,                 -- route segment, e.g. 'keycloak', 'gitlab'
    display_name      VARCHAR(100) NOT NULL,                        -- shown on the login button
    issuer_url        VARCHAR(500) NOT NULL,                        -- base for OIDC discovery (.well-known)
    client_id         VARCHAR(255) NOT NULL,
    client_secret_enc TEXT NOT NULL DEFAULT '',                     -- AES-GCM blob; '' = public client
    scopes            VARCHAR(255) NOT NULL DEFAULT 'openid email profile',
    button_color      VARCHAR(20),                                  -- optional hex accent for the button
    enabled           BOOLEAN NOT NULL DEFAULT TRUE,
    allow_signup      BOOLEAN NOT NULL DEFAULT TRUE,                -- auto-create unknown users
    position          INTEGER NOT NULL DEFAULT 0,                   -- button order on the login page
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_core_oauth_providers_enabled ON core.oauth_providers(position) WHERE enabled;

CREATE TRIGGER oauth_providers_updated_at BEFORE UPDATE ON core.oauth_providers
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- The legacy single-Keycloak settings are superseded by the table above.
DELETE FROM core.settings WHERE key IN ('auth.oauth_keycloak_enabled', 'auth.keycloak_display_name');
