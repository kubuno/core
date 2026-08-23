-- Structured given and family name on `core.users`.
--
-- ## What this closes, and why now
--
-- The account has carried a single `display_name` and, since `000114`, a set of
-- personal profile fields — but never a first name and a last name of their
-- own. That gap surfaced the day the mail module needed to build an address from
-- a rule an administrator writes (`{prenom}.{nom}@domaine`): a template with no
-- structured name behind it can only guess by splitting `display_name`, and
-- "Jean-Marie Le Bihan" is exactly the guess that goes wrong. So the two names
-- become real columns, real `/api/v1/me` fields, real form controls on the
-- profile AND on the administration sheet, and real switches.
--
-- ## Nullable, and NOT backfilled from `display_name`
--
-- Not one account is made to have these filled. Splitting `display_name` into
-- first + last would invent a fact nobody stated — a middle name, a particle, a
-- family name written first — and it would do so silently, in twenty
-- deployments, on the sole event of an upgrade. `NULL` is "not stated", every
-- account starts there, and the mail rule falls back to the username when a name
-- part is absent. A person or an administrator fills them when they choose to.
--
-- ## Where these values go, and do not
--
-- Read by `GET /api/v1/me` (oneself), the administration sheet, and — unlike
-- gender or birthday — usable by the mail provisioning as the source of an
-- address. They are NOT added to `search_users` / `lookup_users`: the directory
-- keeps answering `display_name`, username and photo, so turning a structured
-- name on does not change what every people picker in every module discloses.

-- ── The columns ──────────────────────────────────────────────────────────────
--
-- Widths are backstops; `models::user` enforces the same bounds first and
-- answers a 422 naming the field rather than letting the driver report a
-- truncation.
ALTER TABLE core.users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS last_name  VARCHAR(120);

COMMENT ON COLUMN core.users.first_name IS 'Given name. Free text, never required; a source for the mail address rule.';
COMMENT ON COLUMN core.users.last_name  IS 'Family name. Free text, never required; a source for the mail address rule.';

-- ── The two switches ─────────────────────────────────────────────────────────
--
-- Same shape, scope and reader as `directory.profile_edit_name` and its `000114`
-- siblings: `overridable`, resolved at the user scope through
-- `settings::chain::resolve_for`, read by `handlers::users::update_me` before the
-- transaction opens. Seeded TRUE, for the same reason the others are: what they
-- govern is whether a person may state something about themselves, and seeding
-- closed would withdraw that on an upgrade rather than protect anyone — the name
-- is not thereby hidden, only put out of its owner's reach.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, scope, value_type) VALUES
    ('directory.profile_edit_first_name', 'true', 'true', 'directory',
     'Modifier son prénom',
     'Une personne peut renseigner son prénom. Désactivé, seul un administrateur le fait, et une tentative est refusée avec un message explicite plutôt qu''ignorée.',
     FALSE, 'overridable', 'bool'),
    ('directory.profile_edit_last_name', 'true', 'true', 'directory',
     'Modifier son nom de famille',
     'Une personne peut renseigner son nom de famille. Désactivé, seul un administrateur le fait, et une tentative est refusée avec un message explicite plutôt qu''ignorée.',
     FALSE, 'overridable', 'bool')
ON CONFLICT (key) DO NOTHING;
