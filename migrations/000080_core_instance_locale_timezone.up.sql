-- Instance language and time zone.
--
-- Until now the core had neither. A language was a per-account preference and
-- nothing else, so an instance had no way to state the language it speaks — the
-- sign-in page, which is served before anybody is authenticated and therefore
-- before any preference exists, guessed from the browser. And the only time zone
-- stored anywhere belonged to the calendar module (`calendar.default_timezone`),
-- which says how a calendar draws its grid, not how the instance dates what it
-- writes to a human.
--
-- ## Two keys, two visibilities
--
-- `instance.locale` is PUBLIC on purpose. It is served by `/api/v1/config`,
-- the one endpoint reachable without a session, because the reader that needs it
-- most — the sign-in page — runs before authentication. A setting the login page
-- cannot see is a setting the login page cannot obey.
--
-- `instance.timezone` is NOT public. Nothing renders a date before sign-in, and
-- the zone an organisation keeps its clocks in is a hint about where it is;
-- there is no reason to hand it to an unauthenticated caller.
--
-- ## Who reads them
--
-- Neither key is declared without a reader — a setting nothing reads is a
-- control that only pretends to exist.
--
--   instance.locale    → `core/i18n/index.ts` (`detectInitialLang`, sign-in page)
--                      → `settings::intl::locale_for` (outgoing mail)
--                      → `health::checks::instance_locale`
--   instance.timezone  → `settings::intl::timezone_for` (outgoing mail stamp)
--                      → `health::checks::instance_timezone`
--
-- ## Scope
--
-- Both are resolved through the chain of migration `000060`, so a value set on
-- an organisational unit reaches every account under it: a multilingual
-- organisation gives its Madrid unit Spanish password-reset mail without
-- touching a single account. `instance.locale` is declared `overridable`
-- because an account genuinely overrides it (the language picker writes
-- `users.preferences.language`); `instance.timezone` is `global` because the
-- core exposes no per-account time zone.

INSERT INTO core.settings
    (key, value, default_value, category, label, description, is_public, scope, value_type, allowed_values)
VALUES
    ('instance.locale', '"en"', '"en"', 'general',
     'Langue de l''instance',
     'La langue dans laquelle l''instance s''adresse à quelqu''un dont elle ne sait rien : la page de connexion, avant toute authentification, et les courriels destinés à un compte qui n''a choisi aucune langue. Une préférence de compte l''emporte toujours sur elle.',
     TRUE, 'overridable', 'enum',
     '["en","fr","es","pt","it","de","el","ru","ar","he","hi","zh","ja"]'::jsonb),
    ('instance.timezone', '"UTC"', '"UTC"', 'general',
     'Fuseau horaire de l''instance',
     'Identifiant IANA (Europe/Paris, America/New_York…) dans lequel l''instance date ce qu''elle écrit à un humain — l''horodatage des courriels qu''elle envoie. Les horodatages d''API et les journaux restent en temps universel : ils sont lus par des machines.',
     FALSE, 'global', 'string', NULL)
ON CONFLICT (key) DO NOTHING;
