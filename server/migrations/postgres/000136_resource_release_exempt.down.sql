-- 000136_resource_release_exempt.down.sql
ALTER TABLE core.resources
    DROP COLUMN IF EXISTS release_exempt;
