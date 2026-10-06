-- Only the guarantees are dropped, in the reverse order of the `up` side.
--
-- What the `up` side did to the DATA is not undone, and cannot honestly be:
-- the accounts it attached to the root were attached to NOTHING before, and a
-- reversal would have to guess which of the accounts currently at the root were
-- among them. The deleted setting values pointed at subjects that do not exist,
-- so there is nothing to restore them to either.

ALTER TABLE core.users ALTER COLUMN org_unit_id DROP NOT NULL;

-- Back to the referential action of migration 000036. It is only coherent again
-- because the NOT NULL above is gone.
ALTER TABLE core.users DROP CONSTRAINT IF EXISTS users_org_unit_id_fkey;
ALTER TABLE core.users
    ADD CONSTRAINT users_org_unit_id_fkey
    FOREIGN KEY (org_unit_id) REFERENCES core.org_units(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS org_units_lift_members ON core.org_units;
DROP FUNCTION IF EXISTS core.org_units_lift_members();

DROP TRIGGER IF EXISTS users_place_in_tree ON core.users;
DROP FUNCTION IF EXISTS core.users_place_in_tree();

DROP FUNCTION IF EXISTS core.root_org_unit_id();
