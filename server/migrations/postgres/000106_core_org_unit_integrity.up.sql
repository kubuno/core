-- Structural integrity of the organizational-unit tree.
--
-- `core.org_units` has been a tree only by convention since 000036: nothing in
-- the schema said there is exactly ONE root, and nothing said two sisters may
-- not carry the same name. Both assumptions are relied upon everywhere:
--
--   * The console renders "the" tree from the single row with a NULL parent.
--     A second root simply disappears from the view — and, until now, could not
--     even be deleted through the API, which refuses to delete any unit whose
--     `parent_id` is NULL. An accident became a dead end.
--   * `core.setting_chain` (000060) resolves a setting by walking
--     `core.org_unit_ancestors` and ranking each level with
--     `200 + (64 - LEAST(depth, 64))` — "the closest unit wins". A tree with two
--     roots has two different chains for what an administrator reads as one
--     organisation.
--   * An administrator picks a unit by its name. Two sisters spelled
--     "Support" and "support" are indistinguishable in every list.
--
-- The application enforces these rules from now on, but an application check is
-- advisory: it cannot see a concurrent transaction, and it does not apply to
-- SQL run by hand or by a future importer. The two indexes below make the rules
-- true of the data itself.
--
-- ── Order matters ───────────────────────────────────────────────────────────
-- The clean-up runs FIRST. A unique index created on data that violates it
-- fails, and a failing migration means the server refuses to boot — turning a
-- cosmetic inconsistency into an outage. Nothing here deletes: an extra root is
-- reattached under the oldest root, a duplicate name is suffixed. Both are
-- recoverable by hand; a DELETE would not be.

DO $$
DECLARE
    v_root      UUID;
    v_row       RECORD;
    v_candidate TEXT;
    v_suffix    INTEGER;
BEGIN
    -- The oldest root is the one migration 000036 seeded: it is the organisation.
    SELECT id INTO v_root
      FROM core.org_units
     WHERE parent_id IS NULL
     ORDER BY created_at, id
     LIMIT 1;

    -- No root at all means an empty table (or one made entirely of cycles,
    -- which no index can repair). Leave it alone.
    IF v_root IS NULL THEN
        RETURN;
    END IF;

    -- 1. Every other root becomes a child of the real one. Their own subtrees
    --    follow them untouched, and their settings overrides keep resolving —
    --    one level deeper than before, which is the point.
    UPDATE core.org_units
       SET parent_id = v_root
     WHERE parent_id IS NULL
       AND id <> v_root;

    -- 2. Case-insensitive duplicates among siblings. The oldest keeps the name;
    --    the others are suffixed " (2)", " (3)"… until the name is free. Runs
    --    after step 1 so a former root that collides with an existing child of
    --    the root is caught here too.
    FOR v_row IN
        SELECT id, parent_id, name
          FROM (
            SELECT id, parent_id, name,
                   ROW_NUMBER() OVER (
                       PARTITION BY parent_id, LOWER(name)
                       ORDER BY created_at, id
                   ) AS rn
              FROM core.org_units
          ) t
         WHERE t.rn > 1
    LOOP
        v_suffix := 2;
        LOOP
            -- `name` is VARCHAR(255); truncating the stem leaves room for the
            -- longest suffix this loop can produce.
            v_candidate := LEFT(v_row.name, 240) || ' (' || v_suffix || ')';
            EXIT WHEN NOT EXISTS (
                SELECT 1
                  FROM core.org_units u
                 WHERE u.parent_id IS NOT DISTINCT FROM v_row.parent_id
                   AND LOWER(u.name) = LOWER(v_candidate)
            );
            v_suffix := v_suffix + 1;
        END LOOP;

        UPDATE core.org_units SET name = v_candidate WHERE id = v_row.id;
        RAISE NOTICE 'org_units: unité % renommée en « % » (nom déjà pris dans la fratrie)',
                     v_row.id, v_candidate;
    END LOOP;
END $$;

-- ── One root, structurally ──────────────────────────────────────────────────
-- A partial index over a constant-per-row expression: every row with a NULL
-- parent indexes the same key (TRUE), so a second one collides. This is the
-- only way to express "at most one row satisfies P" in PostgreSQL — a CHECK
-- constraint cannot see other rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_core_ou_single_root
    ON core.org_units ((parent_id IS NULL))
 WHERE parent_id IS NULL;

COMMENT ON INDEX core.idx_core_ou_single_root IS
    'Une instance n''a qu''UNE unité racine : au plus une ligne avec parent_id NULL.';

-- ── No two sisters with the same name ───────────────────────────────────────
-- Case-insensitive, like the reference product: "Support" and "support" are the
-- same unit to anyone reading a list. Restricted to non-root rows because NULL
-- keys are distinct from one another in a unique index — the root is already
-- covered by the index above, which allows exactly one of them.
CREATE UNIQUE INDEX IF NOT EXISTS idx_core_ou_sibling_name
    ON core.org_units (parent_id, LOWER(name))
 WHERE parent_id IS NOT NULL;

COMMENT ON INDEX core.idx_core_ou_sibling_name IS
    'Deux unités sœurs ne peuvent pas porter le même nom (comparaison insensible à la casse).';
