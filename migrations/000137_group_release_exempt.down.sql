-- 000137_group_release_exempt.down.sql
ALTER TABLE core.user_groups
    DROP COLUMN IF EXISTS release_exempt;
