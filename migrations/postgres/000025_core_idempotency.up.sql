-- Idempotency keys for safe replay of mutating requests by offline-first
-- clients. When a native/desktop client replays a queued mutation (after a
-- reconnection) carrying the same `Idempotency-Key`, the core returns the stored
-- response instead of executing the side effect twice.
--
-- `id_hash` = SHA-256(actor_hash | method | path | key). Scoping by `actor_hash`
-- (a hash of the Authorization header) isolates each credential: two different
-- users can never collide, and a replayed key only matches its own actor.
CREATE TABLE core.idempotency_keys (
    id_hash      VARCHAR(64) PRIMARY KEY,
    actor_hash   VARCHAR(64) NOT NULL,
    method       VARCHAR(10) NOT NULL,
    path         TEXT        NOT NULL,
    status_code  INTEGER     NOT NULL,
    content_type TEXT,
    body         BYTEA       NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ NOT NULL
);

-- Used by the periodic purge of expired keys.
CREATE INDEX idx_core_idem_expires ON core.idempotency_keys(expires_at);
