-- Outbound mail relay (see `crate::mailer`).
--
-- Until now the core had no SMTP client at all: `POST /auth/forgot-password`
-- minted a token in `core.verification_tokens` and dropped it on the floor —
-- nothing could ever deliver it. These settings are the relay that closes that
-- path, and the one invitations and administrative notices ride on too.
--
-- `mail.smtp_password` stores an AES-256-GCM blob (base64(nonce||ciphertext)),
-- never the plaintext. It is deliberately ABSENT from the audit trail's
-- `SETTING_VALUES_IN_CLEAR` whitelist (`audit/redact.rs`), so a change to it is
-- recorded as «rédigé» — the reader learns that it changed, never what to.
-- The generic settings API refuses the whole `mail` category as well: the
-- encrypted value has one writer, the dedicated `/admin/mail/settings` route.

INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('mail.smtp_enabled',  'false', 'mail', 'Relais SMTP activé',
     'Tant que ce réglage est désactivé, aucun courriel n''est envoyé (les demandes sont ignorées silencieusement).', FALSE),
    ('mail.smtp_host',     '""',    'mail', 'Hôte SMTP',
     'Nom d''hôte du serveur d''envoi, par exemple smtp.exemple.com.', FALSE),
    ('mail.smtp_port',     '587',   'mail', 'Port SMTP',
     'usuellement 587 (STARTTLS), 465 (TLS implicite) ou 25 (sans chiffrement).', FALSE),
    ('mail.smtp_security', '"starttls"', 'mail', 'Chiffrement',
     'aucun, starttls ou tls.', FALSE),
    ('mail.smtp_username', '""',    'mail', 'Identifiant SMTP',
     'Laisser vide pour un relais qui n''exige pas d''authentification.', FALSE),
    ('mail.smtp_password', '""',    'mail', 'Mot de passe SMTP (chiffré)',
     'Chiffré en AES-256-GCM ; jamais renvoyé par l''API ni journalisé.', FALSE),
    ('mail.from_address',  '""',    'mail', 'Adresse d''expédition',
     'Adresse figurant dans l''en-tête From des courriels envoyés par la plateforme.', FALSE),
    ('mail.from_name',     '"Kubuno"', 'mail', 'Nom d''expédition',
     'Nom affiché à côté de l''adresse d''expédition.', FALSE),
    ('mail.public_url',    '""',    'mail', 'URL publique de l''instance',
     'Base des liens insérés dans les courriels. Vide : déduite de la requête reçue.', FALSE)
ON CONFLICT (key) DO NOTHING;
