-- Reverses 000056. The privileges are removed from the roles first, because
-- core.role_privileges references them with ON DELETE RESTRICT (a privilege is
-- never deleted out from under a role by a cascade — see migration 000044).
DELETE FROM core.role_privileges WHERE privilege_key IN ('core.alerts.read', 'core.alerts.manage');
DELETE FROM core.privileges      WHERE key           IN ('core.alerts.read', 'core.alerts.manage');

DELETE FROM core.settings WHERE key LIKE 'alerts.%';

DROP TABLE IF EXISTS core.alert_views;
DROP TABLE IF EXISTS core.alert_events;
DROP TABLE IF EXISTS core.alerts;
