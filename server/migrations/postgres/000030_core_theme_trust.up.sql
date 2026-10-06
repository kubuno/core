-- Bundled themes (imported as .zip) may ship JS that overrides component
-- behaviour. Running that JS in users' browsers is opt-in: the admin must
-- explicitly trust a theme. This setting holds the JSON array of trusted theme
-- IDs. CSS/variables are always applied regardless of this list.
INSERT INTO core.settings (key, value, category, label, description, is_public)
VALUES (
    'appearance.trusted_themes',
    '[]',
    'appearance',
    'Thèmes autorisés à exécuter des scripts',
    'Liste des identifiants de thèmes empaquetés dont le JavaScript est autorisé à s''exécuter dans le navigateur des utilisateurs. La CSS est toujours appliquée, indépendamment de cette liste.',
    FALSE
)
ON CONFLICT (key) DO NOTHING;
