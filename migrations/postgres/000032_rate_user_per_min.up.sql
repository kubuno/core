-- Auth-aware global rate limit: per-USER budget once the per-IP window is hit.
-- A household/office IP carries many legitimate callers (browser tabs, desktop
-- daemon, mobile); a valid-JWT holder is a session-revocation concern, not DDoS.
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('security.rate_user_per_min', '3000', 'security', 'Requêtes max par utilisateur authentifié et par minute',
        'Budget propre d''un utilisateur (Bearer valide) quand la fenêtre IP est saturée : une IP partagée (foyer, bureau) ne s''auto-étrangle plus. Un flood anonyme reste borné par la limite IP (minimum effectif : 60).', FALSE)
ON CONFLICT (key) DO NOTHING;
