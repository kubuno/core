-- Storage administration: the daily trend, the privilege that opens the page,
-- and the two settings the page acts through.
--
-- ## What this migration deliberately does NOT add
--
-- No per-account quota column (`core.users.quota_bytes` already exists, and
-- `core.users.used_bytes` is written by the modules that store bytes), and no
-- per-module usage table. The core knows what each *account* consumes because
-- the storing module maintains that counter; it does not know how that total
-- splits between Drive, Photos and Mail, and inventing a breakdown out of a
-- single number would be a chart that lies. Splitting it needs a channel by
-- which a module declares its own usage — a design decision, not a table.
--
-- ## Why a samples table at all
--
-- Every other trend in the console is derived on the fly from an events table
-- (`signups_daily` counts rows of `core.users` by `created_at`). Storage has no
-- such table: `used_bytes` is a *level*, not a stream of events, and a level
-- that is only ever overwritten has no history to reconstruct. "How fast is it
-- growing, and when do we run out" is the question the reference consoles answer
-- and the one an operator actually arrives with, so the level is sampled.
--
-- One row per day, upserted: a sampler that runs every few hours refines the
-- day it is in rather than piling up rows, and a core restarted five times in an
-- afternoon still leaves one point on the curve.

CREATE TABLE core.storage_samples (
    -- The day is the identity: `ON CONFLICT (day) DO UPDATE` is what makes the
    -- sampler idempotent across restarts and across several core processes.
    day          DATE        PRIMARY KEY,

    -- Sum over `core.users`. Allocated is the sum of the quotas, i.e. what the
    -- instance has promised, which is the number a capacity decision is made
    -- against — not the physical volume, which the health report measures.
    used_bytes   BIGINT      NOT NULL CHECK (used_bytes >= 0),
    quota_bytes  BIGINT      NOT NULL CHECK (quota_bytes >= 0),

    accounts     INTEGER     NOT NULL CHECK (accounts >= 0),
    -- Accounts at or past their own quota on that day. Kept in the sample
    -- because it is the one number whose *history* an operator wants: "we have
    -- been over for three weeks" is a different conversation from "we went over
    -- this morning".
    over_quota   INTEGER     NOT NULL DEFAULT 0 CHECK (over_quota >= 0),

    captured_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.storage_samples IS
    'Daily snapshot of instance storage. Written by the core.storage.sample job.';

-- ── Privilege ────────────────────────────────────────────────────────────────
-- Reading the storage page is its own key rather than a reuse of
-- `core.stats.read`: the page names accounts and how much each of them holds,
-- which is a narrower thing to be trusted with than an instance total. Not
-- OU-scopable — every figure on it is an instance aggregate.
--
-- There is deliberately no `core.storage.manage`: nothing on the page writes
-- through a channel of its own. Changing one account's quota is
-- `core.users.update` (the key whose label already says "quota"), and changing
-- the default policy is `core.settings.manage`. A third key would grant, by its
-- name, a power that is enforced elsewhere.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable) VALUES
    ('core.storage.read', 'core', 'storage', 'read', 'Consulter le stockage',
     'Lire la consommation de l''instance, sa répartition et les comptes qui consomment le plus.', FALSE)
ON CONFLICT (key) DO NOTHING;

-- The read-only administrator holds every `read` key; the seeding query of
-- migration 000044 ran before this one existed, so the grant is explicit here.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, 'core.storage.read'
  FROM core.roles r
 WHERE r.slug = 'read-only-admin'
ON CONFLICT DO NOTHING;

-- The service administrator already holds `core.settings.*` and `core.stats.read`:
-- capacity planning is squarely their job, and refusing them the page that shows
-- it would leave the setting they may change without the reading that justifies it.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, 'core.storage.read'
  FROM core.roles r
 WHERE r.slug = 'service-admin'
ON CONFLICT DO NOTHING;

-- ── Settings ─────────────────────────────────────────────────────────────────

-- `storage.default_quota_bytes` has existed since migration 000004 and was read
-- by nothing: account creation applied a constant compiled into the binary, so
-- raising the setting changed nothing at all (the `continuity.default_quota`
-- health check exists to say so). It is now read at every creation path, and
-- resolved through the scope chain of migration 000060 — which is what makes a
-- per-organisational-unit default possible.
--
-- Declaring the type explicitly closes the last gap: until now the only
-- declaration was the SHAPE of the factory default, so `"10 Go"` was refused for
-- being a string but `-1` was accepted for being a number.
UPDATE core.settings
   SET value_type  = 'int',
       label       = 'Quota par défaut d''un nouveau compte (octets)',
       description = 'Appliqué à la création d''un compte : inscription publique, création par un administrateur, première connexion SSO. Réglable par unité organisationnelle — une unité hérite de son parent tant qu''elle n''a pas sa propre valeur.'
 WHERE key = 'storage.default_quota_bytes';

-- The threshold at which an account's own fill level becomes a piece of work
-- rather than a number on a page. Read by `crate::alerts::producers`, next to
-- the disk thresholds it sits beside in the alert settings.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, value_type) VALUES
    ('alerts.quota_percent', '90', '90', 'alerts', 'Compte saturé : seuil d''alerte (%)',
     'À partir de ce pourcentage de son quota, un compte ouvre une alerte de stockage. Un compte au-delà de 100 % la voit passer en critique : il ne peut plus rien enregistrer.',
     FALSE, 'int')
ON CONFLICT (key) DO NOTHING;
