-- Self-hosted CAPTCHA challenges for the sign-in gate.
--
-- After a configurable number of consecutive failures on an account
-- (`security.login_captcha_after_failures`), the sign-in form must carry a
-- solved challenge before the password is even checked. The challenge is
-- generated and verified here — no third party, no Google reCAPTCHA (Kubuno
-- charter): the image is an SVG the core draws itself, and the answer never
-- leaves the server.
--
-- One row per issued challenge. Short-lived (a few minutes) and single-use:
-- `consumed` is flipped the first time an answer is checked so a solved
-- challenge cannot be replayed. Expired and consumed rows are swept on the next
-- generation, so the table stays small without a scheduled job.
CREATE TABLE core.captcha_challenges (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- The expected solution, upper-cased; the check is case-insensitive.
    answer      TEXT        NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    consumed    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sweep helper: find expired rows to purge on generation.
CREATE INDEX idx_core_captcha_expires ON core.captcha_challenges(expires_at);

-- The threshold, declared like the other security policy keys (migration
-- 000115). Per organisational unit (`overridable`), resolved at the account's
-- scope on sign-in. 0 disables the CAPTCHA gate entirely. Not public: the client
-- is told to show the CAPTCHA by the sign-in response, so the threshold itself
-- need never be exposed.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, scope, value_type) VALUES
    ('security.login_captcha_after_failures', '3', '3', 'security',
     'CAPTCHA après échecs de connexion',
     'Au-delà de ce nombre d''échecs consécutifs sur un même compte, la connexion exige la résolution d''un CAPTCHA — généré et vérifié par le serveur, sans service tiers — jusqu''à la première réussite, qui remet le compteur à zéro. 0 désactive le CAPTCHA. Le compteur est celui du verrouillage de compte (échecs consécutifs depuis la dernière réussite) ; il se réinitialise aussi lors d''une réinitialisation du mot de passe.',
     FALSE, 'overridable', 'int');
