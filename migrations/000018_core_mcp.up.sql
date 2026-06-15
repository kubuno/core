-- Outils MCP déclarés par les modules + activation du serveur MCP.

ALTER TABLE core.module_instances
    ADD COLUMN IF NOT EXISTS mcp_tools JSONB NOT NULL DEFAULT '[]';

INSERT INTO core.settings (key, value, category, label, description, is_public)
VALUES ('mcp.enabled', 'false', 'mcp', 'Serveur MCP activé',
        'Expose les outils des modules via le protocole MCP sur /mcp', FALSE)
ON CONFLICT (key) DO NOTHING;
