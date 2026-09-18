-- Per-identifier failure counter that arms the sign-in CAPTCHA gate.
--
-- The CAPTCHA gate (migration 000133) first counted failures on the ACCOUNT
-- (core.login_throttle, keyed by user id). That is an enumeration oracle: an
-- unknown login never accrued failures, so a CAPTCHA never appeared for it,
-- while an existing account got one after N tries — which tells an attacker the
-- account exists. The rest of sign-in goes to real lengths to avoid exactly that
-- (a dummy argon2 verify, identical error wording, admin-only audit), so the
-- gate must not undo it.
--
-- This table keys the count on the SUBMITTED IDENTIFIER instead, hashed, so it
-- covers existing AND non-existing logins identically — the CAPTCHA appears the
-- same either way. The raw identifier (often an e-mail) is never stored: only
-- its SHA-256. Rows are swept once stale so a stranger cannot grow the table at
-- will (the per-IP sign-in rate limit bounds the inflow meanwhile).
CREATE TABLE core.login_captcha_gate (
    -- SHA-256 (hex) of the trimmed, lower-cased identifier as typed.
    identifier_hash   CHAR(64)    PRIMARY KEY,
    -- Consecutive failures since the last success on this identifier.
    failed_count      INTEGER     NOT NULL DEFAULT 0,
    -- First failure of the current run, for the staleness sweep.
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sweep helper: find rows untouched for a while, to purge on the next write.
CREATE INDEX idx_core_login_captcha_gate_stale ON core.login_captcha_gate(updated_at);
