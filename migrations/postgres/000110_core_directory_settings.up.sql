-- Directory policy: who sees the staff directory, what it shows, and which
-- parts of their own profile a person may rewrite.
--
-- ## Why these keys and not others
--
-- The reference this feature imitates offers a wide profile-editing card
-- (name, photo, gender, pronouns, birthday, work location). `core.users` holds
-- **four** profile columns — `email`, `username`, `display_name`, `avatar_url` —
-- so only *name* and *photo* exist to be governed here. Declaring the other four
-- would produce exactly the defect this console is trying to shed: a switch an
-- operator sets, sees reported as "overridden here", and which governs nothing.
-- They join this migration's siblings the day the columns exist, and not before.
--
-- ## Every key below is READ on a hot path
--
--   `directory.enabled`             → handlers::users::{search_users, lookup_users}
--   `directory.share_email`         → handlers::users::{search_users, lookup_users}
--   `directory.audience`            → handlers::users::{search_users, lookup_users}
--   `directory.profile_edit_name`   → handlers::users::update_me
--   `directory.profile_edit_photo`  → handlers::users::update_me, upload_avatar
--
-- Resolution goes through `crate::settings::directory`, which calls
-- `settings::chain::resolve_for` at the **user** scope: the chain then walks
-- account → groups → the unit and its ancestors → instance → factory, so a value
-- posted on an organisational unit governs everybody underneath it and a lock
-- placed above cannot be undone below. No handler reads `core.settings` directly.
--
-- ## `scope = 'overridable'`, and why that is not a self-service loophole
--
-- `auth.methods` (migration 000090) is the precedent: an administrator may post
-- these per unit, per group or per account. A **user** cannot post them for
-- themselves — `settings::store::sync_user_preferences` mirrors a preference into
-- `core.setting_values` only when the declared `module_id` matches the module
-- that owns the preference subtree, and every key below is core-owned
-- (`module_id IS NULL`). A `PATCH /api/v1/me` carrying
-- `preferences.directory.profile_edit_name = true` is therefore skipped, not
-- honoured — which matters, since granting oneself the right to edit one's own
-- name would empty the card of its meaning.

-- ── Sharing: is there a directory, and what does it disclose ─────────────────

-- Off, `/users/search` and `/users/lookup` answer with an empty list rather than
-- an error: a member picker that returns nobody is the intended experience, and
-- a 403 would surface as a broken module. Administrators are exempt — the
-- console's own pickers must keep working while a policy is being written, the
-- same anti-lockout reasoning as `auth.local_admin_fallback`.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, scope, value_type) VALUES
    ('directory.enabled', 'true', 'true', 'directory',
     'Annuaire visible par les membres',
     'Les membres peuvent rechercher les autres comptes et les voir apparaître dans les sélecteurs de personnes des modules. Désactivé, la recherche de personnes ne renvoie plus rien pour la portée concernée ; les administrateurs conservent la leur, pour ne pas s''enfermer dehors.',
     FALSE, 'overridable', 'bool')
ON CONFLICT (key) DO NOTHING;

-- FALSE reproduces exactly what the route did before this key existed: the
-- directory search has never disclosed an address. Turning it on is therefore an
-- explicit, auditable act of disclosure and never a side effect of an upgrade.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, scope, value_type) VALUES
    ('directory.share_email', 'false', 'false', 'directory',
     'Publier les adresses dans l''annuaire',
     'L''adresse du compte accompagne son nom dans les résultats de l''annuaire. Désactivé, seuls le nom, l''identifiant et la photo circulent — ce que l''annuaire a toujours fait jusqu''ici.',
     FALSE, 'overridable', 'bool')
ON CONFLICT (key) DO NOTHING;

-- The per-unit annuary. `same_unit` is what makes a subsidiary, a support desk
-- or a contractor branch see itself and nothing else: the reference model calls
-- this a "custom directory" and builds a named object for it; here it falls out
-- of the scope engine, because the key is already posted per organisational unit.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, scope, value_type, allowed_values) VALUES
    ('directory.audience', '"all_members"', '"all_members"', 'directory',
     'Étendue de l''annuaire',
     'Qui figure dans l''annuaire tel que le voit une personne de cette portée : tous les comptes de l''instance, ou seulement ceux de son unité organisationnelle et des sous-unités de celle-ci.',
     FALSE, 'overridable', 'enum',
     '[{"value":"all_members","label":"Tous les comptes de l''instance"},
       {"value":"same_unit","label":"Son unité organisationnelle et ses sous-unités"}]')
ON CONFLICT (key) DO NOTHING;

-- ── Profile editing: what a person may rewrite about themselves ─────────────

-- TRUE for both, and this is a deliberate departure from the model imitated,
-- which ships them closed.
--
-- These two capabilities EXIST on every account today: the profile page lets
-- anybody set their display name and their avatar. Seeding them closed would
-- withdraw, on the sole event of running a migration, something twenty-four
-- people currently do — a silent regression is a worse first impression of a
-- feature than a permissive default an administrator closes in one click, per
-- unit, with a lock if they mean it.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, scope, value_type) VALUES
    ('directory.profile_edit_name', 'true', 'true', 'directory',
     'Modifier son nom',
     'Une personne peut changer le nom sous lequel elle apparaît. Désactivé, seul un administrateur le fait, et une tentative est refusée avec un message explicite plutôt qu''ignorée.',
     FALSE, 'overridable', 'bool'),
    ('directory.profile_edit_photo', 'true', 'true', 'directory',
     'Modifier sa photo',
     'Une personne peut changer sa photo de profil, par envoi d''image comme par URL. Désactivé, la photo n''est plus modifiable que par un administrateur.',
     FALSE, 'overridable', 'bool')
ON CONFLICT (key) DO NOTHING;
