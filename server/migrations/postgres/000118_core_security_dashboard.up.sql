-- Index the security dashboard reads on, and nothing else.
--
-- The dashboard adds no table: every panel it draws is an aggregate over facts
-- the core ALREADY records (`core.device_events`, `core.admin_audit`,
-- `core.alerts`, `core.rule_executions`). Storing a second, pre-aggregated copy
-- of those facts would create a surface that can silently disagree with the
-- report each panel links to — the one failure mode a security overview must not
-- have.
--
-- What was missing is access paths. Two of the four sources are indexed for the
-- question their own screen asks, not for the one a dashboard asks:
--
--   * `core.device_events` is indexed `(device_id, occurred_at DESC)` — perfect
--     for "what happened to THIS machine", useless for "how many sign-ins across
--     the instance last month", which reads one `kind` over a date range and
--     would sequentially scan the whole timeline.
--   * `core.alerts` is indexed on the queue's ordering (`severity, last_seen_at`
--     over open alerts only) and on the dedup key. The dashboard counts alerts
--     RAISED in a window, open or closed, which neither index serves.
--
-- Both are plain b-trees on (discriminator, time DESC): the same shape the audit
-- trail already uses for `(action, occurred_at DESC)`, and for the same reason.

-- Sign-ins, first sightings, blocks and disownments, over a date range.
CREATE INDEX IF NOT EXISTS idx_core_device_events_kind_time
    ON core.device_events (kind, occurred_at DESC);

-- Alerts raised in a window, whatever became of them afterwards.
CREATE INDEX IF NOT EXISTS idx_core_alerts_created
    ON core.alerts (created_at DESC);
