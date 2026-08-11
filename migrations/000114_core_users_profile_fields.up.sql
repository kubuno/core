-- Six profile columns on `core.users`, and the six switches that govern them.
--
-- ## What this migration closes
--
-- Migration `000110` declared five directory keys and said, in its own header,
-- that the other profile fields of the console it is modelled on "join this
-- migration's siblings the day the columns exist, and not before". This is that
-- day: `name_pronunciation`, `pronouns`, `work_location`, `introduction`,
-- `gender` and `birthday` become real columns, real `/api/v1/me` fields, real
-- form controls — and only then real switches.
--
-- The seventh inert row, `profile_discovery`, is *not* made into a column: it
-- never was a profile field. It is a visibility control, and this instance
-- already covers it more finely than the model does, through `directory.enabled`
-- and `directory.audience` — posted per organisational unit and lockable. The
-- eighth, `other_personal_info`, has no defined content anywhere and stays a
-- listed absence.
--
-- ## Everything nullable, nothing backfilled with a guess
--
-- Not one of these is a field somebody may be *made* to fill in. `gender` and
-- `birthday` in particular: a platform that means what it says about personal
-- data does not open with a mandatory gender field. `NULL` is a first-class
-- value here — "not stated" — and it is what every account starts at.
--
-- ## `gender` is free text, on purpose
--
-- Not an enum, not a closed list with an "other" escape hatch. A closed list is
-- a taxonomy imposed by whoever wrote the migration on everybody who will ever
-- have an account, and it is the sort of thing that cannot be widened later
-- without a data migration in twenty deployments. Eighty characters of text
-- costs nothing and asks nobody to fit.
--
-- ## Where these values must NOT go
--
-- `gender` and `birthday` are read by `GET /api/v1/me` (oneself), by the
-- administration sheet, and by nothing else. `handlers::users::{search_users,
-- lookup_users}` select their columns explicitly and do not list them: the
-- directory and every people picker in every module answer name, username and
-- photo, as they always have. The audit whitelist (`audit::redact`) does not
-- name them either, so no diff in the trail can carry them.

-- ── The columns ──────────────────────────────────────────────────────────────
--
-- Widths are backstops, not the validation: `models::user` enforces the same
-- bounds before any statement runs, and answers a 422 naming the field rather
-- than letting the driver report a truncation. Having both means a write from
-- some future path that forgets to validate still cannot store a megabyte of
-- prose in a directory field.
ALTER TABLE core.users
    ADD COLUMN IF NOT EXISTS name_pronunciation VARCHAR(120),
    ADD COLUMN IF NOT EXISTS pronouns           VARCHAR(60),
    ADD COLUMN IF NOT EXISTS work_location      VARCHAR(160),
    ADD COLUMN IF NOT EXISTS introduction       TEXT,
    ADD COLUMN IF NOT EXISTS gender             VARCHAR(80),
    ADD COLUMN IF NOT EXISTS birthday           DATE;

-- `introduction` is the only free-length one; a ceiling keeps a profile field
-- from becoming a document store.
ALTER TABLE core.users
    DROP CONSTRAINT IF EXISTS users_introduction_len;
ALTER TABLE core.users
    ADD CONSTRAINT users_introduction_len
    CHECK (introduction IS NULL OR char_length(introduction) <= 4000);

-- A birthday in the future, or before photography, is a typo rather than a
-- date. The bound is deliberately generous — this refuses nonsense, it does not
-- decide who is old enough to have an account.
ALTER TABLE core.users
    DROP CONSTRAINT IF EXISTS users_birthday_plausible;
ALTER TABLE core.users
    ADD CONSTRAINT users_birthday_plausible
    CHECK (birthday IS NULL OR (birthday >= DATE '1900-01-01' AND birthday <= DATE '2200-01-01'));

COMMENT ON COLUMN core.users.name_pronunciation IS 'How the person''s name is pronounced. Free text, never required.';
COMMENT ON COLUMN core.users.pronouns           IS 'Pronouns the person goes by. Free text, never required.';
COMMENT ON COLUMN core.users.work_location      IS 'Where the person works — site, building, floor, "remote". Free text.';
COMMENT ON COLUMN core.users.introduction       IS 'Short self-description shown on the profile.';
COMMENT ON COLUMN core.users.gender             IS 'PERSONAL DATA. Free text, never required, never returned by the directory search or by any people picker.';
COMMENT ON COLUMN core.users.birthday           IS 'PERSONAL DATA. Never required, never returned by the directory search or by any people picker.';

-- ── Carry over what people already entered ───────────────────────────────────
--
-- Three of these six already existed, as free-form keys inside the
-- `preferences` JSON document the profile page writes: `pronouns`, `birthday`
-- and `bio`. Leaving them there would mean the same fact stored twice, with the
-- column governed by a policy and the JSON copy governed by nothing — and, for
-- a birthday, a personal datum surviving in a blob after the person had cleared
-- the field. So the values move, and the old keys are removed in the same
-- transaction as the copy.
--
-- `bio` becomes `introduction`: same thing under the name the console uses.
-- `location` is NOT carried into `work_location` — one is the city somebody
-- lives in, the other is where they work, and merging them would invent a fact
-- nobody stated.
UPDATE core.users
SET pronouns     = COALESCE(pronouns,     NULLIF(left(preferences->'profile'->>'pronouns', 60), '')),
    introduction = COALESCE(introduction, NULLIF(left(preferences->'profile'->>'bio', 4000), ''))
WHERE jsonb_typeof(preferences->'profile') = 'object';

-- The birthday needs a cast, and a cast is the one thing in this file that can
-- fail on data: the old value is whatever a browser once put in a JSON string.
-- Per row, guarded, so one malformed entry costs that entry and not the
-- migration.
DO $$
DECLARE
    row_cursor RECORD;
    parsed     DATE;
BEGIN
    FOR row_cursor IN
        SELECT id, preferences->'profile'->>'birthday' AS raw
        FROM core.users
        WHERE birthday IS NULL
          AND NULLIF(preferences->'profile'->>'birthday', '') IS NOT NULL
    LOOP
        BEGIN
            parsed := row_cursor.raw::date;
        EXCEPTION WHEN OTHERS THEN
            -- Not a date. The person keeps nothing rather than a wrong date;
            -- the account id is not logged, the count is not interesting.
            parsed := NULL;
        END;

        IF parsed IS NOT NULL
           AND parsed >= DATE '1900-01-01' AND parsed <= DATE '2200-01-01' THEN
            UPDATE core.users SET birthday = parsed WHERE id = row_cursor.id;
        END IF;
    END LOOP;
END $$;

-- Now the copies go. `visibility` is left alone: it is the profile page's own
-- per-field public/private map and still names these fields.
UPDATE core.users
SET preferences = jsonb_set(
        preferences,
        '{profile}',
        (preferences->'profile') - 'pronouns' - 'birthday' - 'bio'
    )
WHERE jsonb_typeof(preferences->'profile') = 'object';

-- ── The six switches ─────────────────────────────────────────────────────────
--
-- Same shape, same scope and same reader as `directory.profile_edit_name` and
-- `directory.profile_edit_photo`: `overridable`, resolved at the **user** scope
-- through `settings::chain::resolve_for`, and read by
-- `handlers::users::update_me` before the transaction opens. A refused field is
-- refused with a sentence naming it, never silently dropped.
--
-- All six seed TRUE, and for a sharper reason than "permissive by default".
-- What these keys govern is whether a person may state something **about
-- themselves**. Seeding `gender` or `birthday` closed would not protect anybody:
-- the datum is not thereby hidden, it is merely put out of its owner's reach and
-- into an administrator's. The privacy question — who gets to *see* it — is
-- answered elsewhere and is not negotiable here: neither field leaves the
-- account's own profile and the administration sheet. And three of the six
-- (pronouns, birthday, introduction) are editable today through the profile
-- page; seeding them closed would withdraw, on the sole event of an upgrade,
-- something people already do.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, scope, value_type) VALUES
    ('directory.profile_edit_name_pronunciation', 'true', 'true', 'directory',
     'Modifier la prononciation de son nom',
     'Une personne peut indiquer comment son nom se prononce. Désactivé, seul un administrateur le renseigne, et une tentative est refusée avec un message explicite plutôt qu''ignorée.',
     FALSE, 'overridable', 'bool'),
    ('directory.profile_edit_pronouns', 'true', 'true', 'directory',
     'Modifier ses pronoms',
     'Une personne peut indiquer les pronoms par lesquels elle souhaite être désignée. Désactivé, le champ n''est plus modifiable que par un administrateur.',
     FALSE, 'overridable', 'bool'),
    ('directory.profile_edit_work_location', 'true', 'true', 'directory',
     'Modifier son lieu de travail',
     'Une personne peut indiquer où elle travaille : site, bâtiment, étage, télétravail. Désactivé, l''information relève de l''administration.',
     FALSE, 'overridable', 'bool'),
    ('directory.profile_edit_introduction', 'true', 'true', 'directory',
     'Modifier sa présentation',
     'Une personne peut rédiger le court texte de présentation qui accompagne son profil. Désactivé, le texte n''est plus modifiable que par un administrateur.',
     FALSE, 'overridable', 'bool'),
    ('directory.profile_edit_gender', 'true', 'true', 'directory',
     'Modifier son genre',
     'Donnée personnelle, en texte libre et jamais obligatoire. Désactivé, une personne ne peut plus renseigner ni effacer elle-même ce champ — ce qui le place sous la responsabilité de l''administration, sans le rendre plus confidentiel : il ne figure ni dans l''annuaire ni dans les sélecteurs de personnes, dans tous les cas.',
     FALSE, 'overridable', 'bool'),
    ('directory.profile_edit_birthday', 'true', 'true', 'directory',
     'Modifier sa date de naissance',
     'Donnée personnelle, jamais obligatoire. Désactivé, une personne ne peut plus renseigner ni effacer elle-même sa date de naissance. Comme le genre, elle ne figure ni dans l''annuaire ni dans les sélecteurs de personnes.',
     FALSE, 'overridable', 'bool')
ON CONFLICT (key) DO NOTHING;
