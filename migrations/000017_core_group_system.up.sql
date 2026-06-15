-- Groupes système non supprimables : Administrateurs, Utilisateurs, Invités.

ALTER TABLE core.user_groups
    ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT FALSE;

-- Marquer les groupes de base existants comme système
UPDATE core.user_groups SET is_system = TRUE
WHERE name IN ('Utilisateurs', 'Invités');

-- Ajouter le groupe Administrateurs (système), ou le marquer système s'il existe déjà
INSERT INTO core.user_groups (name, description, permissions, is_default, is_system)
VALUES ('Administrateurs', 'Accès complet à l''administration', '["admin.*"]', FALSE, TRUE)
ON CONFLICT (name) DO UPDATE SET is_system = TRUE;
