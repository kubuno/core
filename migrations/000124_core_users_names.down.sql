-- Reverting drops the two columns and their two switches; the values go with
-- them. Nothing is reconstructed into `display_name`: the up migration never
-- took anything from it, so there is nothing to give back.
DELETE FROM core.settings WHERE key IN (
    'directory.profile_edit_first_name',
    'directory.profile_edit_last_name'
);

ALTER TABLE core.users
    DROP COLUMN IF EXISTS first_name,
    DROP COLUMN IF EXISTS last_name;
