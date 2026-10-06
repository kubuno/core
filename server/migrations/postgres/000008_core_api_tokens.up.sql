-- Tokens d'API personnels (créés par les utilisateurs depuis leur profil)
-- Permettent l'authentification sans JWT depuis des scripts, CLIs, intégrations.
CREATE TABLE core.api_tokens (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    token_hash   VARCHAR(64) UNIQUE NOT NULL,  -- SHA-256 du token brut (hex)
    expires_at   TIMESTAMPTZ,                  -- NULL = pas d'expiration
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    revoked_at   TIMESTAMPTZ
);

CREATE INDEX idx_core_api_tokens_user    ON core.api_tokens(user_id);
CREATE INDEX idx_core_api_tokens_hash    ON core.api_tokens(token_hash)
    WHERE revoked_at IS NULL;
