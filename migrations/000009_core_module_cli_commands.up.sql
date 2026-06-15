-- Commandes CLI déclarées par chaque module installé.
-- Format: [{ "name": "files:upload", "description": "...", "usage": "..." }]
ALTER TABLE core.modules
    ADD COLUMN IF NOT EXISTS cli_commands JSONB NOT NULL DEFAULT '[]';
