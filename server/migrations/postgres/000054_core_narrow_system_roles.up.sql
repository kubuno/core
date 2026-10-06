-- Three narrow system roles, next to the four seeded by migration 000044.
--
-- ── Why ─────────────────────────────────────────────────────────────────────
-- The four roles seeded so far jump from "everything" (super-administrator) to
-- "almost everything": `user-admin` carries nine privileges including account
-- deletion, `service-admin` owns the whole operational surface, and
-- `read-only-admin` reads the entire instance. What was missing is the bottom of
-- the ladder — the roles that are actually delegated day to day, precisely
-- because they are narrow enough to hand out without a second thought:
--
--   * a support desk that unblocks accounts and nothing else. Today the closest
--     fit is `user-admin`, which can also delete the account it was called about;
--   * a read-only view **confined to a branch**. `read-only-admin` is
--     instance-only by the scopability rule (it carries `core.audit.read`,
--     `core.settings.read`…), so a team lead who wants to see their own unit had
--     no role at all;
--   * group administration on its own, without the account privileges that
--     `user-admin` bundles with it.
--
-- ── The scopability rule is not worked around here ──────────────────────────
-- `support-admin` and `directory-reader` carry only privileges flagged
-- `is_ou_scopable = TRUE` in the catalogue, which is what makes them delegable
-- on an organisational unit. The DO block below fails the migration rather than
-- seeding a role whose promised delegability would be a lie.
--
-- `group-admin` is the opposite case and deliberately so: `core.groups.read` and
-- `core.groups.manage` are declared non-scopable because a group crosses
-- organisational units by construction — its members can sit anywhere in the
-- tree, so "this group, but only the Marketing part of it" is not a thing the
-- data model can express, let alone enforce. The role is therefore instance-only
-- and the console will show it as such. Flipping the flag to make the role look
-- delegable would turn every group operation into an instance-wide action
-- performed by someone who believes they are confined to a branch.
--
-- ── Idempotent ───────────────────────────────────────────────────────────────
-- Every statement is replayable: `ON CONFLICT DO NOTHING` on the roles (unique
-- slug) and on their privilege rows (composite primary key). Re-running changes
-- nothing, and in particular never rewrites a role an operator has customised.
-- The four pre-existing roles and every assignment in place are untouched.

-- ── The roles ────────────────────────────────────────────────────────────────
INSERT INTO core.roles (slug, name, description, is_system, is_superuser) VALUES
    ('support-admin',
     'Administrateur du support',
     'Guichet de support : réinitialise un mot de passe, consulte et révoque les sessions, et lit les comptes. Ne crée, ne suspend et ne supprime aucun compte ; ne touche ni aux quotas, ni aux unités, ni aux rôles. Tous ses privilèges sont restreignables : ce rôle peut être délégué sur une unité organisationnelle.',
     TRUE, FALSE),

    ('directory-reader',
     'Lecture d''annuaire',
     'Consulte les comptes et les unités organisationnelles de son périmètre, sans aucune modification. Ne lit ni le journal d''audit, ni les réglages, ni les modules — c''est ce qui le distingue de l''administrateur en lecture seule, et ce qui le rend délégable sur une unité organisationnelle.',
     TRUE, FALSE),

    ('group-admin',
     'Administrateur des groupes',
     'Crée, modifie et supprime les groupes ainsi que leurs membres. Ne touche ni aux comptes, ni aux unités organisationnelles, ni aux réglages. Un groupe traversant les unités par construction, ce rôle s''exerce nécessairement sur toute l''instance et ne peut pas être restreint à une unité.',
     TRUE, FALSE)
ON CONFLICT (slug) DO NOTHING;

-- ── support-admin: unblock an account, and strictly nothing else ─────────────
-- Note what is absent as much as what is present: no `core.users.create`, no
-- `core.users.update` (which carries quota and unit), no `core.users.delete`, no
-- `core.user_suspension.execute`. A support desk that can delete the account it
-- was called about is not a support desk.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, k
  FROM core.roles r,
       unnest(ARRAY[
           'core.user_password.execute',
           'core.sessions.read',
           'core.sessions.delete',
           'core.users.read'
       ]) AS k
 WHERE r.slug = 'support-admin'
ON CONFLICT DO NOTHING;

-- ── directory-reader: look, do not touch ─────────────────────────────────────
-- `core.org_units.read` is scopable (reading the tree is), unlike
-- `core.org_units.manage` (moving a unit changes the tree beyond the subtree it
-- started in), which is exactly why this role stops at reading.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, k
  FROM core.roles r,
       unnest(ARRAY[
           'core.users.read',
           'core.org_units.read'
       ]) AS k
 WHERE r.slug = 'directory-reader'
ON CONFLICT DO NOTHING;

-- ── group-admin: groups only, instance-wide by nature ────────────────────────
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, k
  FROM core.roles r,
       unnest(ARRAY[
           'core.groups.read',
           'core.groups.manage'
       ]) AS k
 WHERE r.slug = 'group-admin'
ON CONFLICT DO NOTHING;

-- ── Self-check: the two delegable roles really are delegable ─────────────────
-- The promise "restreignable par unité" is made in the descriptions above and
-- rendered as a badge in the console. It holds only if every privilege carried
-- is flagged `is_ou_scopable`. Should a future catalogue change flip one of them
-- to non-scopable, the honest outcome is a failed migration naming the culprit —
-- not a role that silently becomes instance-only while still describing itself
-- as delegable.
DO $$
DECLARE
    offenders TEXT;
BEGIN
    SELECT string_agg(r.slug || ' → ' || p.key, ', ' ORDER BY r.slug, p.key)
      INTO offenders
      FROM core.role_privileges rp
      JOIN core.roles r      ON r.id  = rp.role_id
      JOIN core.privileges p ON p.key = rp.privilege_key
     WHERE r.slug IN ('support-admin', 'directory-reader')
       AND NOT p.is_ou_scopable;

    IF offenders IS NOT NULL THEN
        RAISE EXCEPTION
            'Rôles système restreignables incohérents : % . Ces rôles se décrivent comme délégables par unité ; le privilège fautif doit être retiré du rôle, pas rendu restreignable.',
            offenders;
    END IF;
END
$$;
