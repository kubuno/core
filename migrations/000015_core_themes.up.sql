-- Ajoute le paramètre de thème actif dans les settings de l'instance.
INSERT INTO core.settings (key, value, category, label, description, is_public)
VALUES (
    'appearance.theme',
    '"kubuno-light"',
    'appearance',
    'Thème de l''interface',
    'Identifiant du thème actif (kubuno-light, kubuno-dark, ou thème personnalisé).',
    TRUE
)
ON CONFLICT (key) DO NOTHING;
