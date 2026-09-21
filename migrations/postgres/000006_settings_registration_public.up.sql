-- Rend auth.registration_open visible via /api/v1/config (endpoint public)
-- pour que la page de login puisse afficher/masquer le lien d'inscription.
UPDATE core.settings SET is_public = TRUE WHERE key = 'auth.registration_open';
