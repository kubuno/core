CREATE TABLE core.modules (
    id           VARCHAR(100) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    version      VARCHAR(50) NOT NULL,
    description  TEXT,
    author       VARCHAR(255),
    license      VARCHAR(50),
    homepage_url VARCHAR(1000),
    runtime      VARCHAR(20) NOT NULL DEFAULT 'rust'
                     CHECK (runtime IN ('rust', 'python', 'node', 'binary')),
    dependencies TEXT[] NOT NULL DEFAULT '{}',
    is_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
    is_core_module BOOLEAN NOT NULL DEFAULT FALSE,
    config       JSONB NOT NULL DEFAULT '{}',
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE core.module_instances (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id        VARCHAR(100) NOT NULL REFERENCES core.modules(id) ON DELETE CASCADE,
    base_url         VARCHAR(500) NOT NULL,
    routes           JSONB NOT NULL DEFAULT '[]',
    sidebar_items    JSONB NOT NULL DEFAULT '[]',
    subscribed_events TEXT[] NOT NULL DEFAULT '{}',
    status           VARCHAR(20) NOT NULL DEFAULT 'starting'
                         CHECK (status IN ('starting', 'healthy', 'degraded', 'stopped')),
    last_heartbeat   TIMESTAMPTZ,
    pid              INTEGER,
    registered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_core_mi_module ON core.module_instances(module_id);
CREATE INDEX idx_core_mi_status ON core.module_instances(status);

CREATE TABLE core.event_log (
    id            BIGSERIAL PRIMARY KEY,
    event_type    VARCHAR(100) NOT NULL,
    source_module VARCHAR(100),
    payload       JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_core_el_type    ON core.event_log(event_type);
CREATE INDEX idx_core_el_created ON core.event_log(created_at DESC);

CREATE OR REPLACE FUNCTION core.cleanup_event_log() RETURNS void AS $$
BEGIN
    DELETE FROM core.event_log WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
