-- Instance health checks: the "ignored" state, and the timestamp of the last
-- successful relay test.
--
-- ## Why a table rather than a setting
--
-- A self-hosted instance is judged by a list of checks that the server computes
-- from what it can observe (`crate::health`). Most of them are actionable, but
-- some are legitimately not: an instance that lives on a private LAN behind no
-- proxy has no use for HTTPS, and telling its operator so once a week is how a
-- health page becomes wallpaper. "Ignored" is therefore first-class — and,
-- because it is a security decision, it records WHO took it and WHEN, and it is
-- reversible.
--
-- It is a table and not a `core.settings` row because the settings route is a
-- flat key → JSON store with no per-row authorship beyond `updated_by`: keeping
-- one row per muted check is what makes "who silenced this, and when" a query
-- rather than an archaeology of the audit trail. The audit trail still records
-- every mute and un-mute (`core.health_check.mute` / `.unmute`); this table is
-- the current state, the trail is the history.
--
-- `check_id` is deliberately NOT a foreign key to anything: the catalogue of
-- checks lives in Rust, it changes with the code, and a row left behind by a
-- check that no longer exists is inert (the evaluator only looks up the ids it
-- computes). Dropping such rows on upgrade would silently un-ignore a check the
-- operator had deliberately silenced.

CREATE TABLE IF NOT EXISTS core.health_check_mutes (
    -- Stable identifier of the check, e.g. `security.admin_count`. Owned by
    -- `crate::health::catalog`, never by the database.
    check_id   VARCHAR(100) PRIMARY KEY,
    -- The account that took the decision. `SET NULL` rather than `CASCADE`: the
    -- decision outlives the person who made it, and losing the row would
    -- silently re-raise an alert nobody asked to see again.
    muted_by   UUID REFERENCES core.users(id) ON DELETE SET NULL,
    muted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Free-text justification, optional. Never carries a credential: the checks
    -- report verdicts, and so does this.
    reason     TEXT
);

COMMENT ON TABLE core.health_check_mutes IS
    'Health checks the operator chose to ignore, with authorship. Reversible.';

-- ── Last successful outbound-relay test ─────────────────────────────────────
--
-- `POST /admin/mail/test` already existed and already wrote an audit entry, but
-- nothing durable: "is the relay actually able to send?" could only be answered
-- by scanning `core.admin_audit`, which the retention job eventually purges.
-- A configured relay that has never sent anything is the single most common way
-- a self-hosted instance silently loses password resets and invitations, so the
-- fact deserves a stable home.
--
-- It sits in the `mail` category on purpose: that whole category is refused by
-- the generic settings route (`handlers::admin::mail::owns_setting`), so this
-- value can only ever be written by the code that performs the test. An
-- operator cannot mark their own relay as "tested".
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('mail.last_test_ok_at', 'null', 'mail', 'Dernier test de relais réussi',
     'Horodatage ISO-8601 du dernier envoi de test abouti. Écrit par le serveur uniquement.',
     FALSE)
ON CONFLICT (key) DO NOTHING;
