-- Removes the three narrow system roles seeded by the up migration.
--
-- Refuses rather than cleans when any of them still carries an assignment:
-- dropping a role cascades through `core.role_assignments`, which would revoke
-- someone's access as a side effect of a schema rollback — silently, and with no
-- trace of what was taken away. Down migrations are run by an operator who is
-- rolling back a deployment, not by one who has decided to fire the support
-- desk. The exception names what to revoke first.
--
-- Only the three roles of migration 000054 are touched; the four seeded by
-- 000044 and every assignment in place are left alone.
DO $$
DECLARE
    held TEXT;
BEGIN
    SELECT string_agg(r.slug || ' (' || c.n || ')', ', ' ORDER BY r.slug)
      INTO held
      FROM core.roles r
      JOIN LATERAL (
               SELECT COUNT(*) AS n
                 FROM core.role_assignments a
                WHERE a.role_id = r.id
           ) c ON TRUE
     WHERE r.slug IN ('support-admin', 'directory-reader', 'group-admin')
       AND c.n > 0;

    IF held IS NOT NULL THEN
        RAISE EXCEPTION
            'Retrait refusé : des affectations reposent encore sur ces rôles — % . Révoquez-les depuis la console avant d''annuler la migration.',
            held;
    END IF;
END
$$;

DELETE FROM core.role_privileges
 WHERE role_id IN (
           SELECT id FROM core.roles
            WHERE slug IN ('support-admin', 'directory-reader', 'group-admin')
       );

DELETE FROM core.roles
 WHERE slug IN ('support-admin', 'directory-reader', 'group-admin');
