DROP FUNCTION IF EXISTS core.purge_admin_audit(INTEGER);
ALTER TABLE core.settings DROP CONSTRAINT IF EXISTS audit_retention_floor;
DELETE FROM core.settings WHERE key = 'security.audit_retention_days';
DROP TABLE IF EXISTS core.admin_audit;
