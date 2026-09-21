-- Automatic certificates over ACME (Let's Encrypt), the second half of the
-- console-managed HTTPS started in 000125.
--
-- ## Why this is not a second certificate system
--
-- 000125 made the instance able to serve, store and hot-reload a certificate an
-- administrator uploads. This migration adds a producer for that same slot: an
-- ACME client that obtains and renews a certificate on its own. It writes the
-- SAME `core.tls_certificates` row (with `source = 'acme'`), reuses the SAME
-- hot-reload path, and answers HTTP-01 challenges over the core's ordinary HTTP
-- listener. The `network.cert_mode` setting declared in 000125 (`manual` /
-- `acme`) is what chooses between the two producers.
--
-- The ACME protocol (RFC 8555) is handled by the `instant-acme` crate, which
-- terminates over rustls with the ring provider like the rest of the core;
-- nothing here reimplements ACME or any cryptography.
--
-- ## The settings
--
-- Four `network.*` keys, `global` like the rest of the network configuration.
-- The domains are a comma/space separated list stored as a string (a real list
-- would need a settings type the schema does not have, and the picker would add
-- nothing here). The directory URL defaults to Let's Encrypt production; an
-- operator dialling it in first should point it at the staging directory
-- (https://acme-staging-v02.api.letsencrypt.org/directory), whose rate limits
-- are generous, before switching to production.

INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, value_type, scope) VALUES
    ('network.acme_directory_url',
     '"https://acme-v02.api.letsencrypt.org/directory"',
     '"https://acme-v02.api.letsencrypt.org/directory"',
     'network', 'Répertoire ACME',
     'URL du répertoire de l''autorité de certification ACME. Par défaut Let''s Encrypt (production). Pour les premiers essais, utilisez le répertoire de test (staging) « https://acme-staging-v02.api.letsencrypt.org/directory » : ses quotas sont larges et il ne consomme pas les limites de production. Les certificats de staging ne sont pas reconnus par les navigateurs.',
     FALSE, 'string', 'global'),

    ('network.acme_email', '""', '""', 'network', 'Adresse de contact ACME',
     'Adresse à laquelle l''autorité enverra les avis d''expiration et les alertes. Requise pour créer un compte ACME.',
     FALSE, 'string', 'global'),

    ('network.acme_domains', '""', '""', 'network', 'Domaines à certifier',
     'Liste des domaines (séparés par des virgules ou des espaces) que le certificat automatique doit couvrir, par ex. « exemple.fr, www.exemple.fr ». Chaque domaine doit pointer vers cette instance et être joignable en HTTP sur le port 80 : l''autorité vérifie la maîtrise du domaine en récupérant « http://<domaine>/.well-known/acme-challenge/… » servi par le core.',
     FALSE, 'string', 'global'),

    ('network.acme_tos_agreed', 'false', 'false', 'network',
     'Accepter les conditions d''utilisation de l''autorité',
     'La création d''un compte ACME exige l''acceptation des conditions d''utilisation de l''autorité de certification (pour Let''s Encrypt : https://letsencrypt.org/repository/). Cochez pour marquer votre accord.',
     FALSE, 'bool', 'global');

-- ─────────────────────────────────────────────────────────────────────────────
-- The ACME account and the outcome of the last order.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- A single row (the `id = TRUE` singleton): one instance, one ACME account. The
-- account credentials contain the account's private key, so they are stored as
-- an AES-256-GCM blob (domain `kubuno:acme:`), never in clear. `last_order_*`
-- records what the console shows: whether the last issuance/renewal succeeded,
-- when, and — on failure — the reason, so an operator can act without reading
-- the server log.

CREATE TABLE core.acme_state (
    id                            BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
    directory_url                 TEXT,
    email                         TEXT,
    -- AES-256-GCM(base64) of the serialized instant-acme AccountCredentials.
    account_credentials_encrypted TEXT,
    last_order_status             VARCHAR(20)
                                      CHECK (last_order_status IN ('ok', 'error', 'pending')),
    last_order_detail             TEXT,
    last_attempt_at               TIMESTAMPTZ,
    updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.acme_state IS
    'Singleton: the instance ACME account (credentials AES-256-GCM encrypted) and the outcome of the last order.';
