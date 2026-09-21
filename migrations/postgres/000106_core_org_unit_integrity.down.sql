-- Only the guarantees are dropped. The clean-up performed by the `up` side
-- (extra roots reattached, duplicate sibling names suffixed) is data, not
-- structure: undoing it would mean inventing the tree it repaired.
DROP INDEX IF EXISTS core.idx_core_ou_sibling_name;
DROP INDEX IF EXISTS core.idx_core_ou_single_root;
