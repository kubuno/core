-- Whether a module was last installed from a SIGNED catalogue manifest.
--
-- An unsigned module is accepted, with a warning: the third-party ecosystem is
-- young and refusing outright would close the door before the tooling exists.
-- But a warning alone would make the signature decorative — stripping it would
-- be enough to be waved through. So what has been signed once must stay signed:
-- a later version arriving unsigned is refused, exactly as a vanished digest is.
ALTER TABLE core.module_integrity
    ADD COLUMN IF NOT EXISTS signed BOOLEAN NOT NULL DEFAULT FALSE;
