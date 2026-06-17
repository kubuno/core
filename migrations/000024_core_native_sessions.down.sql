DROP INDEX IF EXISTS core.idx_core_rt_family;

ALTER TABLE core.refresh_tokens
    DROP COLUMN IF EXISTS client_type,
    DROP COLUMN IF EXISTS family_id;
