DELETE FROM core.settings WHERE key IN (
    'devices.declared_signals_enabled',
    'devices.country_db_path',
    'devices.block_denies_refresh'
);

DROP INDEX IF EXISTS core.idx_core_rt_active;
DROP INDEX IF EXISTS core.idx_core_rt_device;

ALTER TABLE core.refresh_tokens
    DROP COLUMN IF EXISTS auth_strength,
    DROP COLUMN IF EXISTS country,
    DROP COLUMN IF EXISTS device_id;

DROP TABLE IF EXISTS core.device_events;
DROP TABLE IF EXISTS core.devices;
