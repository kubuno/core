DROP FUNCTION IF EXISTS core.purge_reauth_grants();
DROP INDEX IF EXISTS core.idx_core_reauth_jti;
DROP INDEX IF EXISTS core.idx_core_reauth_user;
DROP TABLE IF EXISTS core.reauth_grants;
DELETE FROM core.settings
 WHERE key IN ('security.reauth_token_ttl_s', 'security.reauth_grace_s');
