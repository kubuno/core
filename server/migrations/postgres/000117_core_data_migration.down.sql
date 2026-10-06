DELETE FROM core.privileges
 WHERE key IN ('core.data_migration.read', 'core.data_migration.manage');

DROP TABLE IF EXISTS core.migration_accounts;
DROP TABLE IF EXISTS core.migration_campaigns;
