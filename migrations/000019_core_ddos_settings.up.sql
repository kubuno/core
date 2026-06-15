-- Réglages anti-DDoS exposés dans le panneau d'administration (catégorie security).
-- Appliqués à chaud par crate::auth::ddos (pas de redémarrage nécessaire).
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('security.ddos_enabled',        'true', 'security', 'Protection anti-DDoS activée',
        'Active le rate-limit par IP et le load-shedding de concurrence. À laisser activé en production.', FALSE),
    ('security.ddos_rate_per_min',   '600',  'security', 'Requêtes max par IP et par minute',
        'Au-delà, les requêtes de cette IP reçoivent 429 (minimum effectif : 60). /health et /ready sont exemptés.', FALSE),
    ('security.ddos_max_concurrent', '1024', 'security', 'Requêtes simultanées maximum',
        'Au-delà, le serveur renvoie 503 immédiatement (load-shedding) pour borner la mémoire (minimum effectif : 16). Les WebSocket sont exemptés.', FALSE)
ON CONFLICT (key) DO NOTHING;
