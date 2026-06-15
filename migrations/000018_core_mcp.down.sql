DELETE FROM core.settings WHERE key = 'mcp.enabled';
ALTER TABLE core.module_instances DROP COLUMN IF EXISTS mcp_tools;
