-- Reverting drops the six columns and their switches.
--
-- Stated plainly: the values go with them, and the copies this migration lifted
-- out of `preferences` are not put back — `pronouns`, `birthday` and the old
-- `bio` were removed from the JSON document on the way up. A down migration
-- that reconstructed them would be inventing the shape a two-versions-ago
-- profile page expected, from data that has since been edited through the
-- columns.
DELETE FROM core.settings WHERE key IN (
    'directory.profile_edit_name_pronunciation',
    'directory.profile_edit_pronouns',
    'directory.profile_edit_work_location',
    'directory.profile_edit_introduction',
    'directory.profile_edit_gender',
    'directory.profile_edit_birthday'
);

ALTER TABLE core.users DROP CONSTRAINT IF EXISTS users_introduction_len;
ALTER TABLE core.users DROP CONSTRAINT IF EXISTS users_birthday_plausible;

ALTER TABLE core.users
    DROP COLUMN IF EXISTS name_pronunciation,
    DROP COLUMN IF EXISTS pronouns,
    DROP COLUMN IF EXISTS work_location,
    DROP COLUMN IF EXISTS introduction,
    DROP COLUMN IF EXISTS gender,
    DROP COLUMN IF EXISTS birthday;
