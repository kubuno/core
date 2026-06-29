DROP TABLE IF EXISTS core.oauth_providers;

INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('auth.oauth_keycloak_enabled', 'false',       'auth', 'Connexion Keycloak activée',
     'Active le bouton SSO Keycloak sur la page de connexion', TRUE),
    ('auth.keycloak_display_name',  '"Keycloak"',  'auth', 'Libellé bouton Keycloak',
     'Texte affiché sur le bouton de connexion Keycloak', TRUE)
ON CONFLICT (key) DO NOTHING;
