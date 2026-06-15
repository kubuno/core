-- Paramètre contrôlant quels rôles peuvent créer des tokens d'API.
-- Valeur : tableau JSON de rôles, ex: ["user","admin"] ou ["admin"].
INSERT INTO core.settings (key, value, category, label, description, is_public)
VALUES (
    'auth.api_token_allowed_roles',
    '["user","admin"]',
    'auth',
    'Rôles autorisés à créer des tokens d''API',
    'Rôles pouvant générer des tokens d''API personnels depuis leur profil. Valeurs possibles : "user", "admin", "guest".',
    TRUE   -- public : le frontend peut afficher/masquer l''onglet sans requête auth
);
