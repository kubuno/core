DROP TABLE IF EXISTS core.storage_reporters;
DROP TABLE IF EXISTS core.storage_usage;
DELETE FROM core.settings WHERE key = 'storage.usage_stale_hours';
