-- Rolls back the storage administration surface.
--
-- The per-scope values of `storage.default_quota_bytes` are left alone: the key
-- itself predates this migration (000004), and a rollback that quietly dropped
-- an operator's per-unit policy would be a data loss disguised as a schema
-- change. Accounts created while the fix was live keep the quota they received —
-- a quota is a stored column, not a derived one.

DROP TABLE IF EXISTS core.storage_samples;

DELETE FROM core.role_privileges WHERE privilege_key = 'core.storage.read';
DELETE FROM core.privileges      WHERE key           = 'core.storage.read';

DELETE FROM core.settings WHERE key = 'alerts.quota_percent';

UPDATE core.settings
   SET value_type  = NULL,
       label       = 'Quota par défaut (bytes)',
       description = NULL
 WHERE key = 'storage.default_quota_bytes';
