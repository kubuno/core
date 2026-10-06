CREATE TABLE core.settings (
    key         VARCHAR(255) PRIMARY KEY,
    value       JSONB NOT NULL,
    category    VARCHAR(100) NOT NULL DEFAULT 'general',
    label       VARCHAR(255),
    description TEXT,
    is_public   BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID REFERENCES core.users(id) ON DELETE SET NULL
);

INSERT INTO core.settings (key, value, category, label, is_public) VALUES
    ('instance.name',               '"Kubuno"',              'general',  'Nom de l''instance',                TRUE),
    ('instance.description',        '"Mon cloud personnel"', 'general',  'Description',                       TRUE),
    ('instance.logo_url',           'null',                  'general',  'URL du logo personnalisé',          TRUE),
    ('instance.color_primary',      '"#1a73e8"',             'general',  'Couleur principale (hex)',           TRUE),
    ('auth.registration_open',      'true',                  'auth',     'Inscription publique activée',      FALSE),
    ('auth.email_verification',     'false',                 'auth',     'Vérification email obligatoire',    FALSE),
    ('auth.oauth_google_enabled',   'false',                 'auth',     'Connexion Google activée',          TRUE),
    ('auth.oauth_github_enabled',   'false',                 'auth',     'Connexion GitHub activée',          TRUE),
    ('storage.default_quota_bytes', '10737418240',           'storage',  'Quota par défaut (bytes)',          FALSE),
    ('storage.max_upload_bytes',    '5368709120',            'storage',  'Taille max upload (bytes)',         TRUE),
    ('security.jwt_access_ttl_s',   '900',                   'security', 'Durée token accès (secondes)',      FALSE),
    ('security.jwt_refresh_ttl_d',  '30',                    'security', 'Durée token refresh (jours)',       FALSE),
    ('security.max_sessions',       '10',                    'security', 'Sessions simultanées max par user', FALSE);
