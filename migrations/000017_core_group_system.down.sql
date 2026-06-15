DELETE FROM core.user_groups WHERE name = 'Administrateurs' AND is_system = TRUE;
ALTER TABLE core.user_groups DROP COLUMN IF EXISTS is_system;
