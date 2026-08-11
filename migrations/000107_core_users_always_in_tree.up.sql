-- Every account lives in the organisational tree — as an invariant, not a habit.
--
-- ── What was wrong ──────────────────────────────────────────────────────────
-- `core.users.org_unit_id` was nullable and three of the four account-creation
-- paths never set it: public sign-up (`handlers/auth/register.rs`), the first
-- SSO sign-in (`handlers/auth/oauth_users.rs`) and the seeded administrator
-- (`database/seed.rs`). Only the admin console and the LDAP provisioner placed
-- the account. On the instance this migration was written against, 12 accounts
-- out of 31 had no unit.
--
-- An account outside the tree is not a cosmetic gap. Three subsystems built on
-- the tree quietly skip it:
--
--   * Delegated administration (`core.role_assignments.scope_org_unit_id`,
--     migration 000044) filters by subtree — an account attached to nothing is
--     in no subtree, so it is INVISIBLE to every delegated administrator. It
--     can only be seen, and therefore only be governed, instance-wide.
--   * `core.setting_chain` (000060) anchors on `core.users.org_unit_id`. A NULL
--     anchor means the whole org-unit segment of the chain is empty, so the
--     account resolves `default → instance` and SKIPS every unit-level value —
--     including a LOCKED one. Migration 000091:17-21 documented exactly this
--     trap for `auth.methods`: somebody the directory just authenticated can be
--     locked out the next day because the instance policy does not list
--     `directory`. The trap was never closed, only described.
--   * The default quota is resolved per unit (`models::user::default_quota_for`)
--     and per-unit target audiences (000105) key on the unit as well.
--
-- ── Why the fix is structural rather than three INSERT statements ───────────
-- Adding the column to the three INSERTs would fix today's three paths and
-- nothing else. As long as "outside the tree" remains a REPRESENTABLE state,
-- every feature built on units has to handle it, and the fourth path — the one
-- written next year, or a bulk import run by hand — will forget again. The
-- state stops being representable here.
--
-- ── Why NOT NULL and not a column DEFAULT ──────────────────────────────────
-- PostgreSQL column defaults must be constant-ish expressions; a default cannot
-- read the root's id out of `core.org_units`. So the enforcement is split in
-- two, and the pair is what holds:
--
--   * `NOT NULL` states the invariant and lets the database refuse a violation;
--   * a BEFORE INSERT/UPDATE trigger PLACES an account whose unit was left NULL
--     at the root, which is what a DEFAULT would have done had it been legal.
--
-- The trigger, not the constraint, is what keeps existing callers working: the
-- LDAP provisioner binds `dir.default_org_unit_id` explicitly and that column
-- is nullable (`directory/provision.rs`), and the admin console binds an
-- optional `org_unit_id`. Both send a literal NULL, which a bare NOT NULL would
-- turn into a 500 on account creation. Coerced instead of refused.
--
-- ── The contradiction with ON DELETE SET NULL, treated head-on ──────────────
-- Migration 000036 declared `REFERENCES core.org_units(id) ON DELETE SET NULL`.
-- Under NOT NULL that referential action can no longer be performed: deleting a
-- unit that still has members would raise a not-null violation and the deletion
-- would fail — an outage-shaped regression on a routine administrative act.
-- PostgreSQL has no "ON DELETE SET <value>", so the action is replaced by:
--
--   * `ON DELETE NO ACTION` — a unit that is still referenced when the
--     statement ends is a refusal, never a silent orphaning; and
--   * a BEFORE DELETE trigger on `core.org_units` that LIFTS the members to the
--     parent (or, if the parent is going away too, to the root).
--
-- This is the same rule the console already applies by hand
-- (`handlers/admin/org_units.rs::delete_org_unit` reparents children and
-- members before deleting, and refuses to delete the root). The trigger makes
-- it true of the data rather than of one code path: a deletion issued by SQL,
-- by a future importer, or by a cascade now reparents too instead of dropping
-- people out of the tree.
--
-- ── Reading the root ────────────────────────────────────────────────────────
-- The root is the row with `parent_id IS NULL`. Migration 000106 adds a unique
-- index making it singular, but this file must not depend on having run after
-- it: every lookup here is `ORDER BY created_at, id LIMIT 1`, which is the
-- SAME row 000106 keeps as the real root (it reattaches the others underneath
-- it with the identical ordering). Either application order therefore produces
-- the same answer, and the ordering stays correct once the index makes the
-- extra rows impossible.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. The root, as a function
-- ─────────────────────────────────────────────────────────────────────────────

-- One definition, used by the backfill, by the placement trigger and by the
-- deletion trigger. Written defensively (see the header) rather than assuming
-- 000106 has already made the answer unique.
CREATE OR REPLACE FUNCTION core.root_org_unit_id() RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT id
      FROM core.org_units
     WHERE parent_id IS NULL
     ORDER BY created_at, id
     LIMIT 1;
$$;

COMMENT ON FUNCTION core.root_org_unit_id() IS
    'Unité racine de l''organisation (parent_id IS NULL). Lecture défensive : la plus ancienne, même ordre que la migration 000106.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. The accounts already outside the tree
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    v_root    UUID;
    v_placed  BIGINT;
BEGIN
    v_root := core.root_org_unit_id();

    -- No root at all means an instance whose 000036 seed was removed by hand.
    -- One is created rather than failing the migration: refusing to boot over a
    -- missing row nobody can add without the server running is a dead end.
    IF v_root IS NULL THEN
        INSERT INTO core.org_units (name, parent_id)
        VALUES (
            COALESCE(
                (SELECT value #>> '{}' FROM core.settings WHERE key = 'instance.name'),
                'Organisation'
            ),
            NULL
        )
        RETURNING id INTO v_root;
        RAISE NOTICE 'org_units: aucune racine trouvée, racine recréée (%)', v_root;
    END IF;

    -- Attached to the root, which is where migration 000036 already put every
    -- account that existed at the time. Nothing is moved: only rows that point
    -- at nothing are touched.
    UPDATE core.users
       SET org_unit_id = v_root
     WHERE org_unit_id IS NULL;

    GET DIAGNOSTICS v_placed = ROW_COUNT;
    IF v_placed > 0 THEN
        RAISE NOTICE 'users: % compte(s) hors de l''arbre rattaché(s) à la racine %', v_placed, v_root;
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Placement: what a column DEFAULT would have done, if it could
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION core.users_place_in_tree() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_root UUID;
BEGIN
    -- The common case: a caller that named a unit. No lookup at all.
    IF NEW.org_unit_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    v_root := core.root_org_unit_id();
    IF v_root IS NULL THEN
        -- Only reachable if the root was deleted out of band. Failing loudly is
        -- the point: the alternative is an account nobody can administer.
        RAISE EXCEPTION 'core.org_units n''a pas d''unité racine : impossible de placer le compte %', NEW.id
            USING ERRCODE = 'not_null_violation';
    END IF;

    NEW.org_unit_id := v_root;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION core.users_place_in_tree() IS
    'Place à la racine tout compte créé (ou mis à jour) sans unité. Tient lieu de DEFAULT, qu''une valeur non constante ne peut pas exprimer.';

-- `UPDATE OF org_unit_id` and not plain UPDATE: every other write to an account
-- (a sign-in timestamp, a quota, a display name) would otherwise pay for a
-- branch it can never take.
DROP TRIGGER IF EXISTS users_place_in_tree ON core.users;
CREATE TRIGGER users_place_in_tree
    BEFORE INSERT OR UPDATE OF org_unit_id ON core.users
    FOR EACH ROW EXECUTE FUNCTION core.users_place_in_tree();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Deleting a unit lifts its members instead of dropping them out of the tree
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION core.org_units_lift_members() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_target UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM core.users u WHERE u.org_unit_id = OLD.id) THEN
        RETURN OLD;
    END IF;

    -- The parent, when it survives. During a cascade (`org_units.parent_id` is
    -- ON DELETE CASCADE) the parent row is already gone when this fires for the
    -- child, so the lookup finds nothing and the root is used instead.
    SELECT o.id INTO v_target FROM core.org_units o WHERE o.id = OLD.parent_id;
    IF v_target IS NULL THEN
        v_target := core.root_org_unit_id();
    END IF;

    -- `v_target = OLD.id` is the root being deleted: it is still visible from a
    -- BEFORE trigger, so the root lookup returns the very row on its way out.
    -- There is nowhere to lift anybody to, and emptying the tree is not a
    -- deletion anyone meant to perform. Refused, exactly as the API refuses it.
    IF v_target IS NULL OR v_target = OLD.id THEN
        RAISE EXCEPTION 'Suppression de l''unité % refusée : ses comptes n''ont aucune unité de repli (racine supprimée ?)',
            OLD.id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    UPDATE core.users SET org_unit_id = v_target WHERE org_unit_id = OLD.id;
    RETURN OLD;
END;
$$;

COMMENT ON FUNCTION core.org_units_lift_members() IS
    'Remonte les comptes d''une unité supprimée vers son parent (ou la racine). Remplace l''ancien ON DELETE SET NULL, contradictoire avec NOT NULL.';

DROP TRIGGER IF EXISTS org_units_lift_members ON core.org_units;
CREATE TRIGGER org_units_lift_members
    BEFORE DELETE ON core.org_units
    FOR EACH ROW EXECUTE FUNCTION core.org_units_lift_members();

-- The referential action itself. Dropped by lookup rather than by name: 000036
-- created it inline (`ADD COLUMN … REFERENCES …`), so its name is whatever
-- PostgreSQL generated on that instance.
DO $$
DECLARE
    v_conname TEXT;
BEGIN
    SELECT c.conname INTO v_conname
      FROM pg_constraint c
      JOIN pg_attribute a
        ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
     WHERE c.conrelid  = 'core.users'::regclass
       AND c.confrelid = 'core.org_units'::regclass
       AND c.contype   = 'f'
       AND a.attname   = 'org_unit_id'
     LIMIT 1;

    IF v_conname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE core.users DROP CONSTRAINT %I', v_conname);
    END IF;
END $$;

-- NO ACTION, not SET NULL: with the lifting trigger above, nothing should ever
-- still reference a unit being deleted — and if something does, a refusal is
-- the right answer. SET NULL would resume producing the very rows this
-- migration exists to eliminate.
ALTER TABLE core.users
    ADD CONSTRAINT users_org_unit_id_fkey
    FOREIGN KEY (org_unit_id) REFERENCES core.org_units(id) ON DELETE NO ACTION;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. The invariant itself
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE core.users ALTER COLUMN org_unit_id SET NOT NULL;

COMMENT ON COLUMN core.users.org_unit_id IS
    'Unité organisationnelle du compte. Jamais NULL : un compte hors de l''arbre est invisible aux administrateurs délégués et saute la chaîne d''héritage des réglages. Laissé vide à l''insertion = racine (déclencheur users_place_in_tree).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Setting values whose scope subject no longer exists
-- ─────────────────────────────────────────────────────────────────────────────
--
-- `core.setting_values.scope_id` is polymorphic and therefore carries no foreign
-- key (000060:77). The purge trigger installed there fires on DELETE of a real
-- subject row, so it cannot reach a row that never had one — written against a
-- uuid that matched nothing. Such a row is not merely inert: it is UNREACHABLE
-- through the API. `core.setting_chain` walks `core.org_unit_ancestors`, which
-- returns nothing for a unit that does not exist, so the resolver reports "no
-- own value at this scope" and `DELETE /admin/settings/scoped/:key` refuses to
-- remove it. It only ever surfaces in the instance-level override warning, as a
-- scope named « ? ».
--
-- The application now refuses to create them (`settings::store::ensure_subject_exists`).
-- This clears the ones already stored.
DELETE FROM core.setting_values v
 WHERE v.scope_type = 'org_unit'
   AND NOT EXISTS (SELECT 1 FROM core.org_units o WHERE o.id = v.scope_id);

DELETE FROM core.setting_values v
 WHERE v.scope_type = 'group'
   AND NOT EXISTS (SELECT 1 FROM core.user_groups g WHERE g.id = v.scope_id);

DELETE FROM core.setting_values v
 WHERE v.scope_type = 'user'
   AND NOT EXISTS (SELECT 1 FROM core.users u WHERE u.id = v.scope_id);
