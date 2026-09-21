-- Login-page animation parameters, tuned from the admin console (Appearance tab)
-- and read publicly by the login page. JSON mirrors AnimParams in the frontend.
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('appearance.login_animation',
     '{"sigma":0.004,"gain":4.7,"amp":0.75,"speed":3.55,"tilt":0.08,"nonUniform":1.0,"shift":0.17}',
     'appearance',
     'Animation de la page de connexion',
     'Paramètres du drapé animé (flou, luminosité, ondulations…) réglés depuis la console d''administration',
     TRUE)
ON CONFLICT (key) DO NOTHING;
