-- Rolls back the backup policy.
--
-- The files already written on disk are left exactly where they are. Dropping a
-- feature must never delete an operator's backups: the rows that describe them
-- go, the archives stay, and `ls` in the destination directory is still a
-- complete answer to "what do I have?".

DROP TABLE IF EXISTS core.backup_runs;

DELETE FROM core.role_privileges WHERE privilege_key IN ('core.backup.read', 'core.backup.manage');
DELETE FROM core.privileges      WHERE key           IN ('core.backup.read', 'core.backup.manage');

-- The scoped values go with the declarations; leaving orphaned rows in
-- `core.setting_values` would resurrect a half-configured policy if the
-- migration is ever replayed.
DELETE FROM core.setting_values WHERE key LIKE 'backup.%';
DELETE FROM core.settings       WHERE key LIKE 'backup.%';
