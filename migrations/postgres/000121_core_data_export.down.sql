-- Rolls back the data-export feature.
--
-- ## The archives on disk are NOT deleted here
--
-- Same rule as the backup rollback (000085), for the opposite reason. There, an
-- operator's backups must survive a feature being dropped. Here, the archives
-- are the most sensitive files the instance ever writes, and a migration is not
-- the place to delete them: `DROP TABLE` runs inside a transaction that may roll
-- back, `unlink` does not, and a down-migration that half-deletes personal data
-- is a worse outcome than one that deletes none.
--
-- What this leaves behind is therefore a directory of `.zip` files, and the
-- operator has to remove them by hand — which is stated in the setting's own
-- description. `ls /var/lib/kubuno/exports` is a complete answer to "what is
-- still there?", precisely because `file_name` was always a base name in a
-- single declared directory.

-- The subjects go first: the CASCADE would do it, but naming it makes the order
-- readable and survives somebody dropping the constraint later.
DROP TABLE IF EXISTS core.data_export_subjects;
DROP TABLE IF EXISTS core.data_export_runs;

DELETE FROM core.role_privileges
 WHERE privilege_key IN ('core.data_export.read', 'core.data_export.execute');
DELETE FROM core.privileges
 WHERE key           IN ('core.data_export.read', 'core.data_export.execute');

-- The scoped values go with the declarations; leaving orphaned rows in
-- `core.setting_values` would resurrect a half-configured policy — in
-- particular a `hold_hours` of zero — if the migration is ever replayed.
DELETE FROM core.setting_values WHERE key LIKE 'data_export.%';
DELETE FROM core.settings       WHERE key LIKE 'data_export.%';
