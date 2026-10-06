-- Collapsing back to one row per (module, account) has to choose what survives.
-- Only the billable categories do: they are what the original channel meant, and
-- what `core.users.used_bytes` is compared against. Keeping the held-but-unbilled
-- categories would leave every account looking larger than its quota counter for
-- reasons no longer visible anywhere.
DELETE FROM core.storage_usage
 WHERE category NOT IN ('content', 'trash', 'versions');

-- Fold the surviving categories into one row per (module, account) before the
-- key narrows, otherwise the second row of a group collides on the restored
-- primary key.
--
-- Deliberately three statements rather than one clever CTE: data-modifying CTEs
-- in PostgreSQL all read the same snapshot and execute in an unspecified order,
-- so a `WITH wiped AS (DELETE …) INSERT …` would race its own delete and fail on
-- the very primary key it was written to avoid.
CREATE TEMP TABLE storage_usage_folded AS
SELECT module_id, user_id,
       SUM(used_bytes)::bigint   AS used_bytes,
       SUM(object_count)::bigint AS object_count,
       MAX(declared_at)          AS declared_at
  FROM core.storage_usage
 GROUP BY module_id, user_id;

DELETE FROM core.storage_usage;

INSERT INTO core.storage_usage (module_id, user_id, used_bytes, object_count, declared_at, category)
SELECT module_id, user_id, used_bytes, object_count, declared_at, 'content'
  FROM storage_usage_folded;

DROP TABLE storage_usage_folded;

ALTER TABLE core.storage_usage DROP CONSTRAINT storage_usage_pkey;
ALTER TABLE core.storage_usage
    ADD CONSTRAINT storage_usage_pkey PRIMARY KEY (module_id, user_id);

ALTER TABLE core.storage_usage DROP CONSTRAINT IF EXISTS storage_usage_category_check;
ALTER TABLE core.storage_usage DROP COLUMN category;

DROP INDEX IF EXISTS core.idx_core_su_user;
CREATE INDEX idx_core_su_user ON core.storage_usage(user_id);

DELETE FROM core.settings WHERE key IN (
    'storage.usage_authoritative',
    'storage.usage_correction_min_bytes'
);
