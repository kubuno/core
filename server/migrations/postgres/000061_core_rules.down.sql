-- Reverses 000061. Privileges are removed from the roles first, because
-- core.role_privileges references them with ON DELETE RESTRICT (migration 000044).
DELETE FROM core.role_privileges WHERE privilege_key IN ('core.rules.read', 'core.rules.manage');
DELETE FROM core.privileges      WHERE key           IN ('core.rules.read', 'core.rules.manage');

DELETE FROM core.settings WHERE key LIKE 'rules.%';

DROP INDEX IF EXISTS core.idx_core_el_type_created;
ALTER TABLE core.event_log DROP COLUMN IF EXISTS cause_rule_id;
ALTER TABLE core.event_log DROP COLUMN IF EXISTS depth;

DROP INDEX IF EXISTS core.idx_core_alerts_simulation;
ALTER TABLE core.alerts DROP COLUMN IF EXISTS is_simulation;

DROP TABLE IF EXISTS core.rule_backtests;
DROP TABLE IF EXISTS core.rule_hits;
DROP TABLE IF EXISTS core.rule_executions;
DROP TABLE IF EXISTS core.rule_versions;
DROP TABLE IF EXISTS core.rules;
DROP TABLE IF EXISTS core.rule_actions;
DROP TABLE IF EXISTS core.rule_triggers;
