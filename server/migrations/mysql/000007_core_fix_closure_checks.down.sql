-- Drops the constraints 000007 added. The mistranslated ones it removed are not
-- put back: they rejected valid rows.
ALTER TABLE `data_export_runs`
    DROP CONSTRAINT `data_export_window_ordered`,
    DROP CONSTRAINT `data_export_closure_coherent`;
ALTER TABLE `alerts` DROP CONSTRAINT `alert_closure_coherent`;
