DELETE FROM core.settings WHERE key IN (
    'auth.oauth_keycloak_enabled',
    'auth.keycloak_display_name'
);
