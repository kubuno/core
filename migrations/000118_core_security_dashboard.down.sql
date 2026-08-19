-- Drops the two access paths added for the security dashboard. No data is lost:
-- the migration created no table and no column.
DROP INDEX IF EXISTS core.idx_core_alerts_created;
DROP INDEX IF EXISTS core.idx_core_device_events_kind_time;
