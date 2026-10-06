-- Forces a password change on next sign-in (set by the seeder when the initial
-- administrator is created with the hard-coded default password).
ALTER TABLE core.users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
