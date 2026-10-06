-- Type and tuning for the self-hosted sign-in CAPTCHA (migration 000133).
--
-- The challenge is generated with no user context (the `/auth/captcha` endpoint
-- is anonymous), so all of this is instance-wide (`global`): one look, and one
-- kind of test, for the whole instance. An administrator can pick WHICH human
-- test to show and how hard to make it.

-- Which test a stored challenge is, so verification knows how to read `answer`:
--   'text'   → the distorted characters to type (answer = the code)
--   'slider' → a jigsaw piece to slide into place (answer = the target X, px)
--   'math'   → a small sum to solve (answer = the result)
ALTER TABLE core.captcha_challenges
    ADD COLUMN kind TEXT NOT NULL DEFAULT 'text';

INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, scope, value_type, allowed_values) VALUES
    ('security.captcha_type', '"text"', '"text"', 'security',
     'Type de test humain',
     'Le genre de défi présenté quand un CAPTCHA est exigé : « Texte déformé » (recopier des caractères), « Puzzle coulissant » (faire glisser une pièce jusqu''à sa place dans l''image) ou « Calcul » (résoudre une petite opération). Tous sont générés et vérifiés par le serveur, sans service tiers.',
     FALSE, 'global', 'enum', '[{"value":"text","label":"Texte déformé"},{"value":"slider","label":"Puzzle coulissant"},{"value":"math","label":"Calcul"}]'::jsonb),

    ('security.captcha_length', '5', '5', 'security',
     'Longueur du code (texte)',
     'Nombre de caractères à recopier, pour le type « Texte déformé ». Accepté entre 4 et 8 : plus long = plus dur à deviner et à lire.',
     FALSE, 'global', 'int', NULL),

    ('security.captcha_distortion', '40', '40', 'security',
     'Force de déformation (texte)',
     'Intensité de la rotation et de l''ondulation des caractères, de 0 (droits, faciles à lire) à 100 (fortement déformés, plus résistants aux robots mais plus pénibles à lire). N''affecte que le type « Texte déformé ». 40 par défaut.',
     FALSE, 'global', 'int', NULL),

    ('security.captcha_noise', '40', '40', 'security',
     'Bruit visuel (texte)',
     'Densité des points parasites et des lignes qui traversent l''image, de 0 (fond propre) à 100 (très bruité). N''affecte que le type « Texte déformé ». 40 par défaut.',
     FALSE, 'global', 'int', NULL),

    ('security.captcha_slider_tolerance', '6', '6', 'security',
     'Tolérance du puzzle (pixels)',
     'Écart maximal, en pixels, entre la position où l''utilisateur relâche la pièce et son emplacement exact, pour le type « Puzzle coulissant ». Plus la valeur est basse, plus il faut être précis. Accepté entre 2 et 20 ; 6 par défaut.',
     FALSE, 'global', 'int', NULL),

    ('security.captcha_math_max', '10', '10', 'security',
     'Valeur maximale (calcul)',
     'Plus grand nombre utilisé dans l''opération, pour le type « Calcul » (une addition de deux nombres tirés entre 1 et cette valeur). Accepté entre 5 et 50 ; 10 par défaut.',
     FALSE, 'global', 'int', NULL);
