-- Where accounts imported from a directory are placed in the organisational
-- tree.
--
-- ── Why this is not derived from the DN ─────────────────────────────────────
-- A single named unit rather than a mapping built from the entry's `ou=`
-- components. An `ou=` is a NAMING hierarchy, not an org chart: Active
-- Directory uses organisational units to scope group policy, plenty of
-- directories keep everybody in one flat `ou=people`, and the real structure
-- usually lives in the groups. Auto-creating units from DN components would
-- silently build the very tree that now governs BOTH delegated authorisation
-- (`core.role_assignments.scope_org_unit_id`) and which authentication method
-- applies (`auth.methods`, migration 000090). Guessing that is not worth being
-- wrong about; naming it is one field. The DN is kept on the account
-- (`core.users.ldap_dn`), so a richer mapping stays possible later without
-- losing information now.
--
-- ── Why it matters beyond tidiness ──────────────────────────────────────────
-- `core.setting_chain` anchors on `core.users.org_unit_id`. An imported account
-- placed nowhere therefore resolves `auth.methods` at the INSTANCE level — which
-- may not include `directory`, leaving somebody the directory just authenticated
-- unable to sign in the next day. Naming the unit closes that trap.
--
-- Separate from 000090 on purpose: that migration is already applied on running
-- instances, and sqlx checksums every file it has run. Editing an applied
-- migration makes the next boot refuse to start.
ALTER TABLE core.ldap_directories
    ADD COLUMN IF NOT EXISTS default_org_unit_id UUID
        REFERENCES core.org_units(id) ON DELETE SET NULL;
