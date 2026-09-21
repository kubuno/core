-- Déconnexion automatique après une durée d'INACTIVITÉ (minutes, 0 = désactivé).
-- Réglage global éditable par l'administrateur. is_public = TRUE : le frontend le
-- lit pour piloter son minuteur d'inactivité et son rafraîchissement de jeton.
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('security.session_idle_timeout_min', '30', 'security',
     'Déconnexion après inactivité (minutes)',
     'Déconnecte l''utilisateur après ce nombre de minutes sans activité. 0 = désactivé.',
     TRUE)
ON CONFLICT (key) DO NOTHING;
