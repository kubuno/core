-- HTTP / HTTPS configuration driven from the administration console.
--
-- ## Why this exists
--
-- Until now the core's TLS termination was decided once, at boot, from
-- `config.toml [server.tls]` — a file only a shell user with root on the host
-- can edit. An administrator with no shell could neither turn HTTPS on nor
-- replace an expiring certificate. This migration moves that decision into the
-- instance's settings, so the console can manage it like everything else, and
-- adds the one thing settings cannot hold: the certificate material itself.
--
-- The cryptography is NOT reimplemented here. The core keeps terminating TLS
-- with rustls (already a dependency, memory-safe, audited); this migration only
-- stores WHICH certificate rustls should serve and the levers around it. rustls
-- categorically cannot speak SSLv3 / TLS 1.0 / TLS 1.1, so the hardening an
-- Apache operator must apply by hand is, here, the only behaviour available.
--
-- ## The certificate table
--
-- One row per certificate the instance holds; at most ONE is active at a time
-- (a partial unique index enforces it). The private key never lives in clear:
-- it is stored as an AES-256-GCM blob keyed by a domain-separated derivation of
-- the JWT secret — the same construction the SMTP relay, the OIDC client
-- secrets and the LDAP service password already use (`crate::network::config`).
-- The certificate chain itself is public and stored as-is.
--
-- `source` distinguishes a chain an administrator uploaded from one obtained
-- automatically over ACME (Let's Encrypt) in a later increment; the schema is
-- deliberately the same for both so the renewal path never drifts from the
-- manual one.

CREATE TABLE core.tls_certificates (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source        VARCHAR(20) NOT NULL DEFAULT 'upload'
                      CHECK (source IN ('upload', 'acme')),
    -- Full PEM chain (leaf + intermediates). Public, stored verbatim.
    cert_pem      TEXT NOT NULL,
    -- AES-256-GCM(base64) of the private-key PEM. Never returned by any route.
    key_encrypted TEXT NOT NULL,
    -- Human-facing metadata, parsed from the leaf at upload time so the console
    -- can show "expires in N days" without re-parsing on every read.
    subject       TEXT,
    issuer        TEXT,
    san           TEXT[] NOT NULL DEFAULT '{}',
    not_before    TIMESTAMPTZ,
    not_after     TIMESTAMPTZ,
    is_active     BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by   UUID REFERENCES core.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- At most one active certificate. The one rustls actually serves.
CREATE UNIQUE INDEX uq_core_tls_active
    ON core.tls_certificates (is_active)
    WHERE is_active = TRUE;

-- Soonest-to-expire first: what a renewal check and the console both want.
CREATE INDEX idx_core_tls_not_after
    ON core.tls_certificates (not_after);

COMMENT ON TABLE core.tls_certificates IS
    'TLS certificates the instance can serve; at most one active at a time. Private key stored AES-256-GCM encrypted.';

-- ─────────────────────────────────────────────────────────────────────────────
-- The settings — declared `global`: TLS termination is a process-wide property
-- of the instance, exactly like the anti-DDoS limiters. There is no sense in
-- which one organisational unit could serve a different protocol version than
-- another, so none of these are `overridable`.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Changing `https_enabled`, `https_port` or the redirect binds or unbinds a
-- socket, which only a restart can do; the console says so plainly. Replacing
-- the certificate and changing HSTS, on the other hand, take effect live.

INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, value_type, scope) VALUES
    ('network.https_enabled', 'false', 'false', 'network',
     'Terminer le HTTPS dans le core',
     'Le core sert directement en HTTPS avec le certificat actif, sans reverse-proxy. Nécessite un certificat installé plus bas. Activer ou désactiver cette option lie ou délie une socket : la bascule ne prend effet qu''au redémarrage du service. Laissez cette option désactivée si un reverse-proxy (nginx…) termine déjà le TLS devant le core.',
     FALSE, 'bool', 'global'),

    ('network.https_port', '8443', '8443', 'network',
     'Port HTTPS',
     'Port d''écoute du HTTPS quand le core termine le TLS lui-même. Le port 443 (web standard) exige que le service ait la capacité CAP_NET_BIND_SERVICE ; 8443 fonctionne sans privilège. Un changement de port ne prend effet qu''au redémarrage.',
     FALSE, 'int', 'global'),

    ('network.http_redirect_to_https', 'false', 'false', 'network',
     'Rediriger le HTTP vers le HTTPS',
     'Écoute aussi en HTTP nu et renvoie chaque requête (redirection permanente 308) vers l''équivalent HTTPS. Sans effet si le HTTPS n''est pas terminé par le core. Prise en compte au redémarrage.',
     FALSE, 'bool', 'global'),

    ('network.http_redirect_port', '80', '80', 'network',
     'Port de la redirection HTTP',
     'Port sur lequel écouter le trafic HTTP à rediriger vers le HTTPS. 80 (web standard) exige CAP_NET_BIND_SERVICE.',
     FALSE, 'int', 'global'),

    ('network.tls_min_version', '"1.2"', '"1.2"', 'network',
     'Version minimale de TLS',
     'Version la plus ancienne de TLS que le core acceptera. TLS 1.2 est le plancher recommandé aujourd''hui ; TLS 1.3 uniquement offre la meilleure sécurité mais peut exclure des clients anciens. Les versions antérieures (SSLv3, TLS 1.0, TLS 1.1), obsolètes et vulnérables, ne sont de toute façon pas prises en charge. Ce réglage est appliqué au prochain rechargement du certificat ou au redémarrage.',
     FALSE, 'enum', 'global'),

    ('network.hsts_enabled', 'true', 'true', 'network',
     'En-tête HSTS (HTTP Strict Transport Security)',
     'Indique au navigateur de n''accéder au site qu''en HTTPS pendant la durée ci-dessous. L''en-tête n''est émis que lorsque le core sert réellement en HTTPS : l''activer sans HTTPS n''a aucun effet. Prend effet à chaud.',
     FALSE, 'bool', 'global'),

    ('network.hsts_max_age_days', '365', '365', 'network',
     'Durée du HSTS (jours)',
     'Combien de temps le navigateur doit refuser le HTTP en clair après avoir vu l''en-tête. Une durée longue renforce la protection mais engage l''instance à rester joignable en HTTPS pendant toute cette période.',
     FALSE, 'int', 'global'),

    ('network.hsts_include_subdomains', 'true', 'true', 'network',
     'HSTS : inclure les sous-domaines',
     'Étend la contrainte HTTPS à tous les sous-domaines. Ne l''activez que si tous vos sous-domaines savent servir en HTTPS.',
     FALSE, 'bool', 'global'),

    ('network.hsts_preload', 'false', 'false', 'network',
     'HSTS : éligibilité au préchargement',
     'Ajoute la directive « preload », condition pour être inscrit dans la liste de préchargement HSTS des navigateurs. À n''activer qu''en connaissance de cause : le retrait de cette liste est lent et manuel.',
     FALSE, 'bool', 'global'),

    ('network.cert_mode', '"manual"', '"manual"', 'network',
     'Mode de gestion du certificat',
     'Manuel : vous fournissez le certificat et sa clé. Automatique (ACME / Let''s Encrypt) : le core obtient et renouvelle le certificat tout seul. Le mode automatique est proposé dans un incrément ultérieur.',
     FALSE, 'enum', 'global');

-- The closed domains of the two enum settings (labelled form, so the picker can
-- translate them).
UPDATE core.settings
   SET allowed_values = '[{"value":"1.2","label":"TLS 1.2"},{"value":"1.3","label":"TLS 1.3"}]'
 WHERE key = 'network.tls_min_version';

UPDATE core.settings
   SET allowed_values = '[{"value":"manual","label":"Manuel"},{"value":"acme","label":"Automatique (ACME)"}]'
 WHERE key = 'network.cert_mode';
