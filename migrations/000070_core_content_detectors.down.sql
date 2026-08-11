-- Rolls back the data-protection layer. The rule engine of 000061 survives
-- intact: a rule whose condition tree carried a detector leaf keeps its JSON,
-- and that leaf simply stops matching — the same behaviour a disabled detector
-- already produces, so nothing here can silently turn a blocking rule into a
-- permissive one it was not written as.

DROP INDEX IF EXISTS core.idx_core_rule_exec_gate_ref;
ALTER TABLE core.rule_executions DROP COLUMN IF EXISTS gate_reference;

DROP TABLE IF EXISTS core.content_detectors;

DELETE FROM core.settings WHERE key IN (
    'rules.gate.enabled',
    'rules.gate.fail_mode',
    'rules.gate.timeout_ms',
    'rules.detectors.max_part_bytes',
    'rules.detectors.max_scan_ms',
    'rules.detectors.max_parts'
);
