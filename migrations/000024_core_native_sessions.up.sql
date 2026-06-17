-- Native/desktop sessions: allow refresh tokens to be returned in the JSON body
-- (instead of an HttpOnly cookie) for non-browser clients, with rotation.
--
-- `family_id` groups a rotation chain (all refresh tokens descending from one
-- login on one device). On refresh-token reuse detection we revoke the whole
-- family. `client_type` records how the session was opened ('web' keeps the
-- cookie behaviour; 'native'/'desktop' receive the refresh token in JSON).
ALTER TABLE core.refresh_tokens
    ADD COLUMN IF NOT EXISTS family_id   UUID,
    ADD COLUMN IF NOT EXISTS client_type VARCHAR(20);

-- Speeds up family-wide revocation on reuse detection.
CREATE INDEX IF NOT EXISTS idx_core_rt_family
    ON core.refresh_tokens(family_id) WHERE revoked_at IS NULL;
