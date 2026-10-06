DELETE FROM core.settings WHERE key = 'usage.retention_days';
DROP TABLE IF EXISTS core.module_usage_daily;
