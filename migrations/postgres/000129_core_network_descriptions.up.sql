-- Corrects the wording of the `network.*` settings after the listener rework.
--
-- Three descriptions written in 000125/000127 no longer match what the code
-- does, and a setting whose text contradicts its behaviour is worse than one
-- with no text at all:
--
--   * `cert_mode` still announced ACME as "offered in a later increment" — it
--     ships now;
--   * the redirect settings described a separate listener that replaced the HTTP
--     port. The core now serves HTTP **and** HTTPS at the same time, like any
--     ordinary web server: enabling HTTPS never takes the HTTP port away, and
--     the redirect is what that port *answers*, not whether it exists.
--
-- Only the human-facing text changes here; no key, type, default or value is
-- touched. 000125 itself is left alone: it is already applied on running
-- instances, and an applied migration is frozen.

UPDATE core.settings SET description =
    'Manuel : vous fournissez le certificat et sa clé, et vous les remplacez vous-même avant expiration. Automatique (ACME / Let''s Encrypt) : le core obtient le certificat tout seul et le renouvelle 30 jours avant son expiration ; renseignez alors le répertoire, l''adresse de contact et les domaines ci-dessous.'
 WHERE key = 'network.cert_mode';

UPDATE core.settings SET description =
    'Le core sert directement en HTTPS avec le certificat actif, sans reverse-proxy. Nécessite un certificat installé. Le port HTTP continue d''être servi en parallèle : activer le HTTPS ne coupe ni un mandataire inverse ni une sonde qui l''utilise. Lier ou délier la socket HTTPS ne prend effet qu''au redémarrage du service. Inutile si un reverse-proxy (nginx…) termine déjà le TLS devant le core.'
 WHERE key = 'network.https_enabled';

UPDATE core.settings SET description =
    'Sur le port HTTP, répondre à chaque requête par une redirection permanente (308) vers son équivalent HTTPS, au lieu de servir l''application. Deux exceptions, toujours servies en clair : la validation ACME (« /.well-known/acme-challenge/… »), sans quoi le renouvellement automatique cesserait de fonctionner ; et les requêtes qu''un mandataire inverse de confiance annonce comme déjà chiffrées (« X-Forwarded-Proto: https »), qu''il serait absurde de renvoyer vers HTTPS. Sans effet si le HTTPS n''est pas terminé par le core. Prise en compte au redémarrage.'
 WHERE key = 'network.http_redirect_to_https';

UPDATE core.settings SET description =
    'Port HTTP SUPPLÉMENTAIRE à écouter en plus du port habituel, typiquement 80 pour recevoir le trafic web standard et le rediriger. Utilisé uniquement quand la redirection ci-dessus est activée. Un port inférieur à 1024 exige la capacité CAP_NET_BIND_SERVICE ; s''il ne peut pas être lié, le service démarre quand même et le signale dans le journal.'
 WHERE key = 'network.http_redirect_port';
