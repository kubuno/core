CREATE TABLE core.jobs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type     VARCHAR(100) NOT NULL,
    module_id    VARCHAR(100),
    payload      JSONB NOT NULL DEFAULT '{}',
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'running', 'done', 'failed')),
    attempts     INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    error        TEXT,
    run_after    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at   TIMESTAMPTZ,
    done_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_core_jobs_pending ON core.jobs (run_after)
    WHERE status = 'pending';

CREATE TABLE core.rate_limit_windows (
    key          VARCHAR(255) NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    count        INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (key, window_start)
);

CREATE INDEX idx_core_rl_key ON core.rate_limit_windows(key, window_start DESC);
