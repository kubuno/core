-- Administrative audit trail.
--
-- `core.event_log` records *what happened in the system*; it carries no actor,
-- no address and no before/after value, so an administrative action leaves no
-- attributable trace. This table is the attributable one: every privileged
-- mutation writes exactly one row, in the same transaction as the mutation
-- itself, so an entry cannot be lost when it matters most.
--
-- Design notes:
--  * `actor_label` is denormalised on purpose. `actor_id` is a nullable FK that
--    goes NULL when the account is deleted; the label keeps the trail readable
--    ("who did this") for the whole retention window regardless.
--  * `actor_origin` separates a human at a browser (`session`) from a program
--    holding a personal API token (`api_token`), a module calling `/internal/*`
--    (`internal`) and the server acting on its own (`system`, e.g. seeding,
--    scheduled purges). Only the token *identifier* is ever stored — never the
--    token, nor any hash of it.
--  * `outcome = 'denied'` rows are first-class: an attempt outside an operator's
--    perimeter is a security signal, and dropping it would blind the reader to
--    exactly the events worth alerting on.
--  * The two self-references support undo: `reverts_entry_id` points at the
--    entry this one undoes, `reverted_by_entry_id` is the back-pointer written
--    on the undone entry. `reversible` says whether a replayable inverse exists.

CREATE TABLE core.admin_audit (
    id                   BIGSERIAL PRIMARY KEY,
    occurred_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- ── Actor ────────────────────────────────────────────────────────────────
    actor_id             UUID REFERENCES core.users(id) ON DELETE SET NULL,
    actor_label          VARCHAR(320) NOT NULL,
    actor_role           VARCHAR(20),
    actor_origin         VARCHAR(20)  NOT NULL DEFAULT 'session'
                             CHECK (actor_origin IN ('session', 'api_token', 'internal', 'system')),
    -- core.api_tokens(id) when actor_origin = 'api_token'. Deliberately NOT a
    -- foreign key: revoking and purging a token must not erase the trace of what
    -- it did.
    actor_token_id       UUID,

    -- ── Request context ──────────────────────────────────────────────────────
    -- Always filled from crate::auth::client_ip (trusted-proxy aware); never by
    -- reading X-Forwarded-For directly.
    ip_address           INET,
    user_agent           TEXT,

    -- ── Action ───────────────────────────────────────────────────────────────
    action               VARCHAR(120) NOT NULL,   -- 'core.users.update', 'core.settings.change'…
    module_id            VARCHAR(100),            -- 'core' or the module concerned
    target_type          VARCHAR(60),             -- 'user', 'setting', 'module', 'group'…
    target_id            VARCHAR(255),
    target_label         VARCHAR(320),

    -- ── Diff (whitelisted + redacted upstream, see crate::audit::redact) ──────
    before               JSONB,
    after                JSONB,

    outcome              VARCHAR(16)  NOT NULL DEFAULT 'success'
                             CHECK (outcome IN ('success', 'denied', 'error')),
    -- Human-readable reason for 'denied' / 'error'. Never carries a credential.
    detail               TEXT,

    -- ── Undo ─────────────────────────────────────────────────────────────────
    reversible           BOOLEAN      NOT NULL DEFAULT FALSE,
    reverts_entry_id     BIGINT REFERENCES core.admin_audit(id) ON DELETE SET NULL,
    reverted_by_entry_id BIGINT REFERENCES core.admin_audit(id) ON DELETE SET NULL
);

-- Keyset pagination reads (occurred_at, id) strictly descending; the composite
-- index serves both the ordering and the retention purge's range delete.
CREATE INDEX idx_core_audit_occurred ON core.admin_audit (occurred_at DESC, id DESC);
CREATE INDEX idx_core_audit_actor    ON core.admin_audit (actor_id, occurred_at DESC);
CREATE INDEX idx_core_audit_target   ON core.admin_audit (target_type, target_id, occurred_at DESC);
CREATE INDEX idx_core_audit_action   ON core.admin_audit (action, occurred_at DESC);
-- Refusals are rare and queried on their own (alerting): a partial index keeps
-- that scan cheap without weighing on the common insert path.
CREATE INDEX idx_core_audit_denied   ON core.admin_audit (occurred_at DESC)
    WHERE outcome <> 'success';

-- ── Retention ────────────────────────────────────────────────────────────────
-- 400 days ≈ 13 months: one full year of history plus a month of overlap, which
-- is what a year-on-year comparison actually needs.
INSERT INTO core.settings (key, value, category, label, description, is_public)
VALUES (
    'security.audit_retention_days',
    '400',
    'security',
    'Rétention du journal d''audit (jours)',
    'Durée de conservation des entrées du journal d''administration. Plancher : 90 jours, non abaissable.',
    FALSE
)
ON CONFLICT (key) DO NOTHING;

-- The floor is enforced in the application too (see crate::audit::retention);
-- duplicating it here closes the direct-SQL path: a compromised administrator
-- cannot shrink retention to zero to erase their own trail.
ALTER TABLE core.settings
    ADD CONSTRAINT audit_retention_floor CHECK (
        key <> 'security.audit_retention_days'
        OR (jsonb_typeof(value) = 'number' AND (value #>> '{}')::numeric >= 90)
    );

-- Purge helper. Callable from SQL, and mirrored by
-- `crate::audit::retention::purge_expired` for the task runner.
CREATE OR REPLACE FUNCTION core.purge_admin_audit(retention_days INTEGER DEFAULT NULL)
RETURNS BIGINT AS $$
DECLARE
    days    INTEGER;
    deleted BIGINT;
BEGIN
    days := COALESCE(
        retention_days,
        (SELECT (value #>> '{}')::INTEGER FROM core.settings WHERE key = 'security.audit_retention_days'),
        400
    );
    IF days < 90 THEN
        days := 90;
    END IF;

    DELETE FROM core.admin_audit
     WHERE occurred_at < NOW() - make_interval(days => days);

    GET DIAGNOSTICS deleted = ROW_COUNT;
    RETURN deleted;
END;
$$ LANGUAGE plpgsql;
