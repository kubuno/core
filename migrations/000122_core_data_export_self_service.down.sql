-- Rolls back the self-service half of the data export.
--
-- The runs of 000121 stay: dropping the columns removes the ability to tell an
-- account's own request from an administrator's, which is a loss of history, not
-- a loss of data. The archives on disk are not touched here either — same
-- reasoning as 000121's rollback: a migration runs in a transaction that may
-- roll back, `unlink` does not.

DROP INDEX IF EXISTS core.uq_core_data_export_self_active;
DROP INDEX IF EXISTS core.idx_core_data_export_self;

ALTER TABLE core.data_export_runs
    DROP COLUMN IF EXISTS origin,
    DROP COLUMN IF EXISTS download_limit,
    DROP COLUMN IF EXISTS max_file_mb;

-- The scoped values go with the declarations: an orphaned per-unit row would
-- resurrect a policy nobody can see if the migration is ever replayed.
DELETE FROM core.setting_values
 WHERE key IN ('data_export.self_service',
               'data_export.self_hold_hours',
               'data_export.self_max_downloads');
DELETE FROM core.settings
 WHERE key IN ('data_export.self_service',
               'data_export.self_hold_hours',
               'data_export.self_max_downloads');
