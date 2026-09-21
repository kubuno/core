-- Step-up re-authentication grants.
--
-- A sensitive action must not ride on an access token minted twenty minutes ago
-- and left in a tab. The server answers such a call with a *distinguishable*
-- refusal (`REAUTH_REQUIRED`, see crate::errors::AppError), the client proves
-- presence again, and replays the request carrying a short-lived re-auth token.
--
-- Why a table for something a JWT already carries:
--  * REVOCATION — signing out, changing the password or losing the account has to
--    kill an outstanding grant immediately; a stateless token cannot be recalled.
--  * GRACE WINDOW — re-proving presence for every gesture of one working session
--    is the kind of friction that gets a security feature disabled. `grace_until`
--    lets subsequent sensitive calls through without the header, and it is a
--    server-side fact rather than something the client asserts.
--  * FORENSICS — which method actually satisfied the challenge (password, TOTP,
--    backup code) is exactly what an incident review asks for.
--
-- The row stores the token's `jti` only. It never stores the token, nor a hash of
-- it: possession is proved by the signature, and the row's role is to say whether
-- that signature is still honoured.
CREATE TABLE IF NOT EXISTS core.reauth_grants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    -- Identifier carried by the re-auth token. Not a credential.
    jti         UUID NOT NULL UNIQUE,
    method      VARCHAR(20) NOT NULL
                    CHECK (method IN ('password', 'totp', 'backup_code')),
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Lifetime of the token itself (short: minutes).
    expires_at  TIMESTAMPTZ NOT NULL,
    -- End of the "don't ask again" window for this account (longer than the token).
    grace_until TIMESTAMPTZ NOT NULL,
    ip_address  INET
);

CREATE INDEX IF NOT EXISTS idx_core_reauth_user
    ON core.reauth_grants(user_id, grace_until DESC);
CREATE INDEX IF NOT EXISTS idx_core_reauth_jti
    ON core.reauth_grants(jti);

-- Housekeeping: a grant is worthless once its grace window has closed.
CREATE OR REPLACE FUNCTION core.purge_reauth_grants() RETURNS void AS $$
BEGIN
    DELETE FROM core.reauth_grants WHERE grace_until < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

INSERT INTO core.settings (key, value, category, label, description, is_public)
VALUES
    ('security.reauth_token_ttl_s', '300', 'security',
     'Durée du jeton de réauthentification (secondes)',
     'Durée de validité de la preuve fraîche obtenue avant une action sensible.',
     FALSE),
    ('security.reauth_grace_s', '900', 'security',
     'Fenêtre de grâce après réauthentification (secondes)',
     'Durée pendant laquelle les actions sensibles suivantes ne redemandent pas de preuve.',
     FALSE)
ON CONFLICT (key) DO NOTHING;
