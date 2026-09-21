-- Recursive traversal of the organizational-unit tree.
--
-- `core.org_units` is a tree (parent_id) and `core.users.org_unit_id` attaches
-- accounts to it, but nothing could walk it: resolving the ancestors of a unit
-- (settings inheritance — the closest unit wins) or its descendants (delegated
-- role scope, « this rule applies to N users ») had no primitive.
--
-- Both functions carry a DEPTH GUARD. A cycle (A → B → A) makes a naive
-- WITH RECURSIVE loop forever, and the application only refused direct
-- self-parenting until now; a cycle already stored in the database must degrade
-- into a truncated result, never into a hung backend.

-- Ancestor chain of a unit, closest first: depth 0 is the unit itself, depth 1
-- its parent, and so on up to the root.
CREATE OR REPLACE FUNCTION core.org_unit_ancestors(
    p_id        UUID,
    p_max_depth INTEGER DEFAULT 64
)
RETURNS TABLE (id UUID, name TEXT, parent_id UUID, depth INTEGER)
LANGUAGE sql
STABLE
AS $$
    WITH RECURSIVE chain AS (
        SELECT u.id, u.name::TEXT AS name, u.parent_id, 0 AS depth
          FROM core.org_units u
         WHERE u.id = p_id
        UNION ALL
        SELECT p.id, p.name::TEXT, p.parent_id, c.depth + 1
          FROM core.org_units p
          JOIN chain c ON p.id = c.parent_id
         -- Depth guard: bounds the walk even on a cyclic tree.
         WHERE c.depth < GREATEST(COALESCE(p_max_depth, 64), 0)
    )
    -- DISTINCT ON keeps one row per unit (shallowest depth) so a cycle cannot
    -- inflate the result either.
    SELECT d.id, d.name, d.parent_id, d.depth
      FROM (
        SELECT DISTINCT ON (c.id) c.id, c.name, c.parent_id, c.depth
          FROM chain c
         ORDER BY c.id, c.depth
      ) d
     ORDER BY d.depth;
$$;

COMMENT ON FUNCTION core.org_unit_ancestors(UUID, INTEGER) IS
    'Chaîne d''ancêtres d''une unité organisationnelle, du plus proche au plus lointain (depth 0 = l''unité elle-même). Bornée par p_max_depth.';

-- A unit and its whole subtree: depth 0 is the unit itself, depth 1 its direct
-- children, and so on.
CREATE OR REPLACE FUNCTION core.org_unit_descendants(
    p_id        UUID,
    p_max_depth INTEGER DEFAULT 64
)
RETURNS TABLE (id UUID, name TEXT, parent_id UUID, depth INTEGER)
LANGUAGE sql
STABLE
AS $$
    WITH RECURSIVE subtree AS (
        SELECT u.id, u.name::TEXT AS name, u.parent_id, 0 AS depth
          FROM core.org_units u
         WHERE u.id = p_id
        UNION ALL
        SELECT c.id, c.name::TEXT, c.parent_id, s.depth + 1
          FROM core.org_units c
          JOIN subtree s ON c.parent_id = s.id
         -- Depth guard: bounds the walk even on a cyclic tree.
         WHERE s.depth < GREATEST(COALESCE(p_max_depth, 64), 0)
    )
    SELECT d.id, d.name, d.parent_id, d.depth
      FROM (
        SELECT DISTINCT ON (s.id) s.id, s.name, s.parent_id, s.depth
          FROM subtree s
         ORDER BY s.id, s.depth
      ) d
     ORDER BY d.depth, d.name;
$$;

COMMENT ON FUNCTION core.org_unit_descendants(UUID, INTEGER) IS
    'Unité organisationnelle et tout son sous-arbre (depth 0 = l''unité elle-même). Bornée par p_max_depth.';
