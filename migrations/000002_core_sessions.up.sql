CREATE TABLE core.refresh_tokens (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    token_hash    VARCHAR(64) UNIQUE NOT NULL,
    device_name   VARCHAR(255),
    device_type   VARCHAR(50),
    ip_address    INET,
    user_agent    TEXT,
    expires_at    TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at    TIMESTAMPTZ,
    revoke_reason VARCHAR(100)
);

CREATE INDEX idx_core_rt_user    ON core.refresh_tokens(user_id);
CREATE INDEX idx_core_rt_hash    ON core.refresh_tokens(token_hash);
CREATE INDEX idx_core_rt_expires ON core.refresh_tokens(expires_at)
    WHERE revoked_at IS NULL;

CREATE TABLE core.verification_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    purpose    VARCHAR(50) NOT NULL
                   CHECK (purpose IN ('email_verify', 'password_reset', 'invite')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_core_vt_hash ON core.verification_tokens(token_hash)
    WHERE used_at IS NULL;
