-- Per-account login throttle (credential stuffing / brute force).
--
-- Persistent on purpose: the in-memory per-IP limiter (crate::auth::rate_limit)
-- is reset on restart and not shared across instances, so it cannot enforce a
-- ceiling on attempts against one account. This table holds that ceiling per
-- account — it survives restarts and is shared by every instance through the
-- database. Keyed by user id; unknown logins get no row (the per-IP limiter and
-- the constant-time response cover them without letting an attacker fill this
-- table at will).
CREATE TABLE core.login_throttle (
    user_id           UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
    -- Consecutive failed attempts since the last success (reset to 0 on success,
    -- per NIST SP 800-63B).
    failed_attempts   INTEGER     NOT NULL DEFAULT 0,
    -- Start of the sliding 24 h window used for the daily attempt cap (ANSSI).
    window_started_at TIMESTAMPTZ,
    -- Attempts counted within the current 24 h window.
    window_count      INTEGER     NOT NULL DEFAULT 0,
    last_attempt_at   TIMESTAMPTZ,
    -- When set and in the future, sign-in is refused (exponential backoff).
    -- NULL = no active delay.
    locked_until      TIMESTAMPTZ,
    -- How many times this account has been thrown into backoff (audit signal).
    lockout_count     SMALLINT    NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Housekeeping: find rows whose lock has expired (for an optional purge job).
CREATE INDEX idx_core_login_throttle_locked ON core.login_throttle(locked_until)
    WHERE locked_until IS NOT NULL;
