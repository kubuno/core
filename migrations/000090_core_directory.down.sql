DELETE FROM core.settings
 WHERE key IN ('auth.directory_login_enabled', 'auth.directory_provision_on_login');

DROP INDEX IF EXISTS core.idx_core_groups_oauth;
ALTER TABLE core.user_groups DROP COLUMN IF EXISTS oauth_provider_slug;
ALTER TABLE core.oauth_providers
    DROP COLUMN IF EXISTS claim_username,
    DROP COLUMN IF EXISTS claim_email,
    DROP COLUMN IF EXISTS claim_display_name,
    DROP COLUMN IF EXISTS claim_groups,
    DROP COLUMN IF EXISTS sync_groups;

DROP INDEX IF EXISTS core.idx_core_ugm_source;
ALTER TABLE core.user_group_members DROP COLUMN IF EXISTS source;

DROP INDEX IF EXISTS core.idx_core_groups_ldap_dn;
ALTER TABLE core.user_groups
    DROP COLUMN IF EXISTS ldap_directory_id,
    DROP COLUMN IF EXISTS ldap_dn;

-- Accounts the directory alone authenticated cannot satisfy the original
-- constraint. They are deactivated rather than deleted, and the constraint is
-- restored only after they no longer contradict it.
UPDATE core.users SET is_active = FALSE
 WHERE password_hash IS NULL AND oauth_provider IS NULL AND ldap_directory_id IS NOT NULL;
DELETE FROM core.users
 WHERE password_hash IS NULL AND oauth_provider IS NULL AND ldap_directory_id IS NOT NULL;

ALTER TABLE core.users DROP CONSTRAINT IF EXISTS password_or_external;
ALTER TABLE core.users ADD CONSTRAINT password_or_oauth
    CHECK (password_hash IS NOT NULL OR oauth_provider IS NOT NULL);

DROP INDEX IF EXISTS core.idx_core_users_ldap_uid;
DROP INDEX IF EXISTS core.idx_core_users_ldap;
ALTER TABLE core.users
    DROP COLUMN IF EXISTS ldap_directory_id,
    DROP COLUMN IF EXISTS ldap_dn,
    DROP COLUMN IF EXISTS ldap_uid,
    DROP COLUMN IF EXISTS ldap_synced_at;

DROP TABLE IF EXISTS core.ldap_directories;
