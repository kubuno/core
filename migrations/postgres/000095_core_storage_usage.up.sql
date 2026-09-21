-- Per-module storage provenance: which module holds how much, for which account.
--
-- ## The gap this closes
--
-- `core.users.used_bytes` is one number per account with no provenance. Migration
-- 000075 said so in as many words and declined to invent a breakdown out of it.
-- This is the channel that gives the number a source: a module declares **its
-- own** total for an account, and the core sums the declarations beside — never
-- instead of — the authoritative counter.
--
-- ## A level, not a stream
--
-- A row says "module M currently holds N bytes for account U". It is replaced
-- wholesale on every declaration, so re-declaring the same total twice changes
-- nothing: idempotence is a property of the primary key, not of the caller's
-- discipline. A delta protocol would have needed exactly-once delivery over a
-- channel that has none, and would have drifted a little further from the truth
-- on every message the network lost.
--
-- ## Why `used_bytes` is not recomputed from this table
--
-- Quotas are enforced against `core.users.used_bytes`, and today exactly one
-- module (drive) maintains it. Deriving that column from declarations would make
-- every account's ceiling depend on every module reporting correctly and on
-- time — a quota that silently doubles because a module is slow to declare is
-- worse than no breakdown at all. The declarations are therefore *additive
-- provenance*: the console shows what is attributed, what is not, and lets the
-- difference be seen rather than averaged away.

CREATE TABLE core.storage_usage (
    -- The declaring module. Foreign key rather than a free string: a declaration
    -- from a module the core has never registered is a bug or an intrusion, and
    -- both should fail loudly at the door. `ON DELETE CASCADE` means uninstalling
    -- a module takes its (now meaningless) share of the pie with it.
    module_id    VARCHAR(100) NOT NULL REFERENCES core.modules(id) ON DELETE CASCADE,
    user_id      UUID         NOT NULL REFERENCES core.users(id)   ON DELETE CASCADE,

    -- The module's **total** for that account, as of `declared_at`. Never a delta.
    used_bytes   BIGINT       NOT NULL CHECK (used_bytes >= 0),

    -- Optional: how many objects that total covers. Purely informational — it is
    -- what turns "drive holds 4 GiB" into "drive holds 4 GiB across 312 files",
    -- which is the difference between a number and a thing an operator can check.
    object_count BIGINT       CHECK (object_count IS NULL OR object_count >= 0),

    declared_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- The identity that makes re-declaration idempotent.
    PRIMARY KEY (module_id, user_id)
);

-- The console reads the breakdown by module (grouped scan) and the account sheet
-- reads it by account (point lookup). The primary key serves the first; this
-- index serves the second.
CREATE INDEX idx_core_su_user ON core.storage_usage(user_id);

COMMENT ON TABLE core.storage_usage IS
    'Per-module, per-account storage declarations. State, not deltas: a row is the module''s current total.';

-- ── Who is declaring, and when did they last say anything ───────────────────
--
-- Kept in its own table rather than derived from `MAX(declared_at)` over the
-- rows above, for one reason that matters: a module holding **zero** bytes has
-- no rows at all, and would be indistinguishable from a module that has never
-- declared. That distinction is the whole point of the feature — "photos stores
-- nothing" and "photos never told us" are different facts, and a console that
-- renders both as an empty bar is lying about the second one.
CREATE TABLE core.storage_reporters (
    module_id         VARCHAR(100) PRIMARY KEY REFERENCES core.modules(id) ON DELETE CASCADE,

    first_declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_declared_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Last time the module declared its **complete** state (every account it
    -- holds anything for). Incremental declarations refresh one account; only a
    -- full sync can retire a row for an account the module no longer holds
    -- anything for, so this is the timestamp that says "the breakdown is not
    -- just fresh, it is complete".
    last_full_sync_at TIMESTAMPTZ,

    declarations      BIGINT      NOT NULL DEFAULT 0 CHECK (declarations >= 0)
);

COMMENT ON TABLE core.storage_reporters IS
    'One row per module that has ever declared storage usage. Absence of a row means "never declared", which is not zero.';

-- ── The line between "quiet" and "silent" ───────────────────────────────────
--
-- A module that declared yesterday and has said nothing since is reporting a
-- breakdown that is quietly going stale. A module that never declared raises no
-- alert at all: it never promised anything, and alerting on modules that do not
-- store bytes (calendar, tasks) would train an operator to dismiss the alert.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, value_type) VALUES
    ('storage.usage_stale_hours', '24', '24', 'storage',
     'Déclaration de stockage périmée : seuil (heures)',
     'Un module qui a déjà déclaré sa consommation et n''a plus rien déclaré depuis ce délai ouvre une alerte. Sa part reste affichée, signalée comme périmée. Un module qui n''a jamais déclaré n''ouvre aucune alerte : il n''a rien promis.',
     FALSE, 'int')
ON CONFLICT (key) DO NOTHING;
