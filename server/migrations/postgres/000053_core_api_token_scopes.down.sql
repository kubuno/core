DELETE FROM core.settings
 WHERE key IN ('security.api_token_max_ttl_days', 'security.api_token_legacy_grace_days');

DELETE FROM core.role_privileges
 WHERE privilege_key IN ('core.module_admin.execute', 'core.mcp.execute');
DELETE FROM core.privileges
 WHERE key IN ('core.module_admin.execute', 'core.mcp.execute');

ALTER TABLE core.privileges DROP COLUMN IF EXISTS is_token_grantable;

DROP INDEX IF EXISTS core.idx_core_api_tokens_legacy;
DROP INDEX IF EXISTS core.idx_core_api_tokens_scopes;

ALTER TABLE core.api_tokens DROP CONSTRAINT IF EXISTS api_tokens_legacy_has_since;
ALTER TABLE core.api_tokens DROP CONSTRAINT IF EXISTS api_tokens_scoped_or_legacy;

ALTER TABLE core.api_tokens
    DROP COLUMN IF EXISTS legacy_since,
    DROP COLUMN IF EXISTS is_legacy,
    DROP COLUMN IF EXISTS scopes;
