-- Per-scope setting values and their inheritance.
--
-- Until now `core.settings` held exactly one value per key, and the only notion
-- of scope was hard-coded in `handlers/modules.rs`: "user preference ?? global
-- value ?? factory default". No setting could differ between two organisational
-- units, which is the one thing a real administration console is expected to do.
--
-- ## The model
--
-- `core.settings` keeps its role — it is the **schema**: key, value type,
-- allowed values, owning module, factory default, label, public visibility.
-- The values move to `core.setting_values`, indexed by
-- (key, scope_type, scope_id), with four scopes:
--
--     instance  →  org_unit  →  group  →  user
--
-- Resolution walks from the most specific to the most general:
--
--     user ?? group ?? closest org unit ?? instance ?? factory default
--
-- ## An inherited value is NEVER materialised
--
-- There is no row for a scope that inherits. "Revert to the inherited value" is
-- a DELETE, and that is precisely what makes the setting follow its parent
-- again: materialising the inherited value would freeze it and silently break
-- the link the day the parent changes.
--
-- ## Locking
--
-- A locked row short-circuits every level below it and the API refuses any
-- write underneath. This is the addition over the reference model, and it is
-- what makes a sovereign deployment enforceable rather than merely suggested.
--
-- ## Compatibility
--
-- `core.settings.value` is KEPT as a read-compatibility mirror of the instance
-- scope. About twenty call sites across the mailer, the health report, the job
-- runner, the rate limiter and the auth layer read it with plain SQL; breaking
-- them would be a runtime failure, not a compile error. Two triggers keep the
-- mirror and the instance row in lockstep in both directions, so a legacy
-- `UPDATE core.settings SET value = …` still lands in the scoped table. The
-- mirror only ever reflects the instance level — nothing inherited is stored.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. The value table
-- ─────────────────────────────────────────────────────────────────────────────

-- The instance scope has no subject, but a nullable component in a primary key
-- is not a key at all (NULL never equals NULL). A sentinel uuid keeps the
-- primary key total and the upserts trivial.
CREATE TABLE core.setting_values (
    key        VARCHAR(255) NOT NULL REFERENCES core.settings(key) ON DELETE CASCADE,
    scope_type VARCHAR(16)  NOT NULL
                   CHECK (scope_type IN ('instance', 'org_unit', 'group', 'user')),
    scope_id   UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    value      JSONB        NOT NULL,
    -- TRUE: this level wins over every level below it, and the API refuses to
    -- write underneath.
    locked     BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
    PRIMARY KEY (key, scope_type, scope_id),
    -- The sentinel belongs to the instance scope and to no other: a per-unit row
    -- pointing at nothing would resolve for every unit at once.
    CONSTRAINT setting_values_scope_subject CHECK (
        (scope_type =  'instance' AND scope_id =  '00000000-0000-0000-0000-000000000000')
     OR (scope_type <> 'instance' AND scope_id <> '00000000-0000-0000-0000-000000000000')
    )
);

CREATE INDEX idx_core_sv_scope ON core.setting_values(scope_type, scope_id);
CREATE INDEX idx_core_sv_locked ON core.setting_values(key) WHERE locked;

COMMENT ON TABLE core.setting_values IS
    'Valeurs de réglages par portée (instance/unité/groupe/utilisateur). Une portée qui hérite n''a PAS de ligne : « rétablir la valeur héritée » = suppression.';

-- `scope_id` is polymorphic, so it carries no foreign key. Deleting the subject
-- must still take its overrides with it, otherwise a recycled uuid would
-- resurrect a setting nobody remembers.
CREATE OR REPLACE FUNCTION core.setting_values_purge_scope() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM core.setting_values
     WHERE scope_type = TG_ARGV[0] AND scope_id = OLD.id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER org_units_purge_setting_values AFTER DELETE ON core.org_units
    FOR EACH ROW EXECUTE FUNCTION core.setting_values_purge_scope('org_unit');
CREATE TRIGGER user_groups_purge_setting_values AFTER DELETE ON core.user_groups
    FOR EACH ROW EXECUTE FUNCTION core.setting_values_purge_scope('group');
CREATE TRIGGER users_purge_setting_values AFTER DELETE ON core.users
    FOR EACH ROW EXECUTE FUNCTION core.setting_values_purge_scope('user');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Migration of the existing values
-- ─────────────────────────────────────────────────────────────────────────────

-- Settings seeded before migration 000027 have no factory default recorded. The
-- value they carry today *is* their factory default as far as this instance is
-- concerned; adopting it keeps "reset to factory" meaningful instead of NULL.
UPDATE core.settings SET default_value = value WHERE default_value IS NULL;

-- Everything that differs from its factory default was deliberately set by an
-- operator: it becomes the instance-scope row. Everything else needs no row —
-- resolution falls back to `default_value`, which is the same value. The
-- effective value of every key is therefore unchanged by this migration.
INSERT INTO core.setting_values (key, scope_type, value, updated_at, updated_by)
SELECT s.key, 'instance', s.value, s.updated_at, s.updated_by
  FROM core.settings s
 WHERE s.value IS DISTINCT FROM s.default_value;

-- User overrides currently live in `core.users.preferences[<module>][<key>]`.
-- Only the entries that name a declared setting move; the rest of `preferences`
-- (widget layout, language, sidebar widths…) is not a setting and stays put.
-- A stored JSON null means "reverted", which is an absent row here.
INSERT INTO core.setting_values (key, scope_type, scope_id, value, updated_at)
SELECT s.key, 'user', u.id, leaf.value, NOW()
  FROM core.users u
  CROSS JOIN LATERAL jsonb_each(u.preferences) AS mod(module_id, subtree)
  CROSS JOIN LATERAL jsonb_each(subtree)       AS leaf(sub_key, value)
  JOIN core.settings s
    ON s.key = mod.module_id || '.' || leaf.sub_key
 WHERE jsonb_typeof(u.preferences) = 'object'
   AND jsonb_typeof(mod.subtree)   = 'object'
   AND jsonb_typeof(leaf.value)   <> 'null'
   AND s.scope IN ('user', 'overridable')
ON CONFLICT (key, scope_type, scope_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. The compatibility mirror
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN core.settings.value IS
    'Miroir de compatibilité de la portée instance (source de vérité : core.setting_values). Maintenu par déclencheur — ne pas écrire de logique nouvelle dessus.';

-- setting_values (instance) → settings.value.
--
-- `pg_trigger_depth() > 1` means we were reached from the reverse trigger below;
-- writing again would bounce between the two tables. Depth is the standard way
-- to express "only react to a statement a client issued".
CREATE OR REPLACE FUNCTION core.setting_values_mirror() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_row core.setting_values%ROWTYPE;
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NULL;
    END IF;

    IF TG_OP = 'DELETE' THEN
        -- Reverting the instance level puts the factory default back in the
        -- mirror: the legacy readers must see what resolution now returns.
        UPDATE core.settings s
           SET value = COALESCE(s.default_value, s.value)
         WHERE s.key = OLD.key;
        RETURN NULL;
    END IF;

    v_row := NEW;
    UPDATE core.settings s
       SET value      = v_row.value,
           updated_at = v_row.updated_at,
           updated_by = COALESCE(v_row.updated_by, s.updated_by)
     WHERE s.key = v_row.key;
    RETURN NULL;
END;
$$;

-- Two triggers rather than one: a DELETE trigger's WHEN clause cannot reference
-- NEW, and an INSERT/UPDATE one cannot reference OLD.
CREATE TRIGGER setting_values_mirror_instance
    AFTER INSERT OR UPDATE ON core.setting_values
    FOR EACH ROW
    WHEN (NEW.scope_type = 'instance')
    EXECUTE FUNCTION core.setting_values_mirror();

CREATE TRIGGER setting_values_mirror_instance_del
    AFTER DELETE ON core.setting_values
    FOR EACH ROW
    WHEN (OLD.scope_type = 'instance')
    EXECUTE FUNCTION core.setting_values_mirror();

-- settings.value → setting_values (instance).
--
-- This is what keeps every legacy `UPDATE core.settings SET value = …` correct:
-- the write is redirected into the scoped table, which stays the single source
-- of truth. An INSERT only creates a row when the seeded value already differs
-- from the factory default — a freshly declared setting must read as "factory",
-- not as "overridden at instance level".
CREATE OR REPLACE FUNCTION core.settings_value_redirect() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NULL;
    END IF;

    IF TG_OP = 'INSERT' AND NEW.value IS NOT DISTINCT FROM NEW.default_value THEN
        RETURN NULL;
    END IF;

    IF NEW.value IS NOT DISTINCT FROM NEW.default_value THEN
        -- Back to factory at instance level: that is a deletion, never a row
        -- holding the default.
        DELETE FROM core.setting_values
         WHERE key = NEW.key AND scope_type = 'instance';
        RETURN NULL;
    END IF;

    INSERT INTO core.setting_values (key, scope_type, value, updated_at, updated_by)
    VALUES (NEW.key, 'instance', NEW.value, NEW.updated_at, NEW.updated_by)
    ON CONFLICT (key, scope_type, scope_id) DO UPDATE
        SET value      = EXCLUDED.value,
            updated_at = EXCLUDED.updated_at,
            updated_by = COALESCE(EXCLUDED.updated_by, core.setting_values.updated_by);
    RETURN NULL;
END;
$$;

CREATE TRIGGER settings_value_redirect
    AFTER INSERT OR UPDATE OF value ON core.settings
    FOR EACH ROW
    EXECUTE FUNCTION core.settings_value_redirect();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Resolution
-- ─────────────────────────────────────────────────────────────────────────────

-- The full inheritance chain of one setting, as seen from one scope, ordered
-- from the most general level to the most specific one.
--
-- `specificity` is what the caller compares; the exact numbers are an internal
-- convention (factory 0, instance 100, org units 201…264 — the closest unit
-- highest, groups 400, user 500). The org-unit walk reuses
-- `core.org_unit_ancestors` from migration 000041, depth guard included: a cycle
-- in the tree truncates the chain instead of hanging the backend.
--
-- Chains by target scope:
--   instance  → factory, instance
--   org_unit  → factory, instance, ancestors of the unit (itself included)
--   group     → factory, instance, the group
--   user      → factory, instance, ancestors of the user's unit, their groups,
--               the user
--
-- A group is not attached to the tree (it crosses units by construction), so a
-- group's own chain carries no org unit.
CREATE OR REPLACE FUNCTION core.setting_chain(
    p_key        TEXT,
    p_scope_type TEXT,
    p_scope_id   UUID DEFAULT NULL
)
RETURNS TABLE (
    scope_type  TEXT,
    scope_id    UUID,
    scope_name  TEXT,
    specificity INTEGER,
    value       JSONB,
    locked      BOOLEAN,
    updated_at  TIMESTAMPTZ,
    updated_by  UUID
)
LANGUAGE sql
STABLE
AS $$
    WITH anchor AS (
        -- The unit whose ancestry applies to the target scope, if any.
        SELECT CASE
                 WHEN p_scope_type = 'org_unit' THEN p_scope_id
                 WHEN p_scope_type = 'user'
                     THEN (SELECT u.org_unit_id FROM core.users u WHERE u.id = p_scope_id)
                 ELSE NULL
               END AS unit_id
    ),
    levels AS (
        SELECT 'default'::TEXT      AS scope_type,
               NULL::UUID           AS scope_id,
               NULL::TEXT           AS scope_name,
               0                    AS specificity,
               s.default_value      AS value,
               FALSE                AS locked,
               s.updated_at         AS updated_at,
               NULL::UUID           AS updated_by
          FROM core.settings s
         WHERE s.key = p_key AND s.default_value IS NOT NULL

        UNION ALL

        SELECT 'instance', NULL::UUID, NULL::TEXT, 100,
               v.value, v.locked, v.updated_at, v.updated_by
          FROM core.setting_values v
         WHERE v.key = p_key AND v.scope_type = 'instance'

        UNION ALL

        -- depth 0 is the unit itself (most specific), so specificity decreases
        -- as the walk climbs towards the root.
        SELECT 'org_unit', a.id, a.name, 200 + (64 - LEAST(a.depth, 64)),
               v.value, v.locked, v.updated_at, v.updated_by
          FROM anchor
          CROSS JOIN LATERAL core.org_unit_ancestors(anchor.unit_id) a
          JOIN core.setting_values v
            ON v.key = p_key AND v.scope_type = 'org_unit' AND v.scope_id = a.id

        UNION ALL

        SELECT 'group', g.id, g.name::TEXT, 400,
               v.value, v.locked, v.updated_at, v.updated_by
          FROM core.user_groups g
          JOIN core.setting_values v
            ON v.key = p_key AND v.scope_type = 'group' AND v.scope_id = g.id
         WHERE (p_scope_type = 'group' AND g.id = p_scope_id)
            OR (p_scope_type = 'user'  AND EXISTS (
                    SELECT 1 FROM core.user_group_members m
                     WHERE m.group_id = g.id AND m.user_id = p_scope_id))

        UNION ALL

        SELECT 'user', u.id, COALESCE(u.display_name, u.username)::TEXT, 500,
               v.value, v.locked, v.updated_at, v.updated_by
          FROM core.users u
          JOIN core.setting_values v
            ON v.key = p_key AND v.scope_type = 'user' AND v.scope_id = u.id
         WHERE p_scope_type = 'user' AND u.id = p_scope_id
    )
    -- The tie-break inside the group level is explicit rather than accidental:
    -- among several groups of the same user, the most recently set value wins,
    -- and the uuid settles a tie of timestamps so the answer never wobbles.
    SELECT l.scope_type, l.scope_id, l.scope_name, l.specificity,
           l.value, l.locked, l.updated_at, l.updated_by
      FROM levels l
     ORDER BY l.specificity, l.updated_at DESC, l.scope_id NULLS FIRST;
$$;

COMMENT ON FUNCTION core.setting_chain(TEXT, TEXT, UUID) IS
    'Chaîne d''héritage complète d''un réglage vue depuis une portée, du plus général au plus spécifique. La politique (verrou, gagnant, valeur héritée) est appliquée par l''appelant.';

-- Every scope that overrides a key, for the "these units will not be affected"
-- warning shown at instance level.
CREATE OR REPLACE FUNCTION core.setting_overrides(p_key TEXT)
RETURNS TABLE (scope_type TEXT, scope_id UUID, scope_name TEXT, locked BOOLEAN)
LANGUAGE sql
STABLE
AS $$
    SELECT v.scope_type::TEXT,
           v.scope_id,
           COALESCE(o.name, g.name, u.display_name, u.username, '?')::TEXT,
           v.locked
      FROM core.setting_values v
      LEFT JOIN core.org_units   o ON v.scope_type = 'org_unit' AND o.id = v.scope_id
      LEFT JOIN core.user_groups g ON v.scope_type = 'group'    AND g.id = v.scope_id
      LEFT JOIN core.users       u ON v.scope_type = 'user'     AND u.id = v.scope_id
     WHERE v.key = p_key AND v.scope_type <> 'instance'
     ORDER BY v.scope_type, 3;
$$;

COMMENT ON FUNCTION core.setting_overrides(TEXT) IS
    'Portées qui surchargent un réglage — sert à avertir, au niveau instance, que ces portées ne seront pas affectées.';
