CREATE SCHEMA IF NOT EXISTS core;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE core.users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           CITEXT UNIQUE NOT NULL,
    username        VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    display_name    VARCHAR(255),
    avatar_url      VARCHAR(1000),
    role            VARCHAR(20) NOT NULL DEFAULT 'user'
                        CHECK (role IN ('user', 'admin', 'guest')),
    quota_bytes     BIGINT NOT NULL DEFAULT 10737418240,
    used_bytes      BIGINT NOT NULL DEFAULT 0
                        CHECK (used_bytes >= 0),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    oauth_provider  VARCHAR(50),
    oauth_id        VARCHAR(255),
    preferences     JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ,
    CONSTRAINT oauth_unique UNIQUE (oauth_provider, oauth_id),
    CONSTRAINT password_or_oauth CHECK (
        password_hash IS NOT NULL OR oauth_provider IS NOT NULL
    )
);

CREATE INDEX idx_core_users_email  ON core.users(email);
CREATE INDEX idx_core_users_role   ON core.users(role);
CREATE INDEX idx_core_users_active ON core.users(is_active) WHERE is_active = TRUE;

CREATE OR REPLACE FUNCTION core.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON core.users
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();
