-- Wording only; the previous text is the one 000125/000127 inserted. Restoring
-- it exactly would duplicate those strings here for no benefit, so this rollback
-- is deliberately a no-op: re-running 000125 is not how a downgrade works, and
-- no key, type, default or value was changed.
SELECT 1;
