-- Fixes two CHECK constraints the consolidated `000001_core_schema` mistranslated
-- from PostgreSQL (MySQL/MariaDB form). `000001` stays byte-identical: an
-- instance that already applied it keeps its checksum.
--
-- PostgreSQL holds two "closure" constraints that tie a status to a timestamp:
--   alerts            alert_closure_coherent        (status IN ('resolved','ignored')) = (closed_at IS NOT NULL)
--   data_export_runs  data_export_closure_coherent  pending/running <=> finished_at IS NULL
--                     data_export_window_ordered    expires_at > available_at
-- `000001` reduced each closure constraint to its first `IN` list, i.e. a plain
-- `CHECK (status IN ('resolved', 'ignored'))` / `CHECK (status IN ('pending',
-- 'running'))`: no alert could ever be raised as 'new' and no export could ever
-- become 'ready', and an engine switch failed as soon as the source held one.
-- (PostgreSQL's `alert_assignment_coherent` cannot be carried over: MySQL
-- refuses a CHECK on a column an ON DELETE SET NULL foreign key writes — error
-- 3823 — so that pairing stays enforced by the application, as it already was.)
--
-- The stray constraints were created unnamed, so their names differ by server
-- (`alerts_chk_1` on MySQL, `CONSTRAINT_1` on MariaDB): each is found in
-- information_schema by its clause and dropped through a prepared statement.

-- ── alerts ───────────────────────────────────────────────────────────────────
SET @kb_chk := (
    SELECT cc.CONSTRAINT_NAME
      FROM information_schema.CHECK_CONSTRAINTS cc
      JOIN information_schema.TABLE_CONSTRAINTS tc
        ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA
       AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
     WHERE cc.CONSTRAINT_SCHEMA = DATABASE()
       AND tc.TABLE_NAME = 'alerts'
       AND tc.CONSTRAINT_TYPE = 'CHECK'
       AND cc.CHECK_CLAUSE LIKE '%resolved%'
       AND cc.CHECK_CLAUSE LIKE '%ignored%'
       AND cc.CHECK_CLAUSE NOT LIKE '%acknowledged%'
       AND cc.CHECK_CLAUSE NOT LIKE '%closed_at%'
     LIMIT 1
);
SET @kb_sql := IF(@kb_chk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE `alerts` DROP CONSTRAINT `', @kb_chk, '`'));
PREPARE kb_stmt FROM @kb_sql;
EXECUTE kb_stmt;
DEALLOCATE PREPARE kb_stmt;

-- Bring existing rows in line before the real constraints are checked.
UPDATE `alerts` SET `closed_at` = COALESCE(`closed_at`, `updated_at`) WHERE `status` IN ('resolved', 'ignored');
UPDATE `alerts` SET `closed_at` = NULL WHERE `status` NOT IN ('resolved', 'ignored');

ALTER TABLE `alerts`
    ADD CONSTRAINT `alert_closure_coherent`
        CHECK ((`status` IN ('resolved', 'ignored')) = (`closed_at` IS NOT NULL));

-- ── data_export_runs ─────────────────────────────────────────────────────────
SET @kb_chk := (
    SELECT cc.CONSTRAINT_NAME
      FROM information_schema.CHECK_CONSTRAINTS cc
      JOIN information_schema.TABLE_CONSTRAINTS tc
        ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA
       AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
     WHERE cc.CONSTRAINT_SCHEMA = DATABASE()
       AND tc.TABLE_NAME = 'data_export_runs'
       AND tc.CONSTRAINT_TYPE = 'CHECK'
       AND cc.CHECK_CLAUSE LIKE '%pending%'
       AND cc.CHECK_CLAUSE LIKE '%running%'
       AND cc.CHECK_CLAUSE NOT LIKE '%ready%'
       AND cc.CHECK_CLAUSE NOT LIKE '%finished_at%'
     LIMIT 1
);
SET @kb_sql := IF(@kb_chk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE `data_export_runs` DROP CONSTRAINT `', @kb_chk, '`'));
PREPARE kb_stmt FROM @kb_sql;
EXECUTE kb_stmt;
DEALLOCATE PREPARE kb_stmt;

UPDATE `data_export_runs` SET `finished_at` = NULL WHERE `status` IN ('pending', 'running');
UPDATE `data_export_runs` SET `expires_at` = DATE_ADD(`available_at`, INTERVAL 1 SECOND)
 WHERE `expires_at` <= `available_at`;

ALTER TABLE `data_export_runs`
    ADD CONSTRAINT `data_export_closure_coherent`
        CHECK ((`status` IN ('pending', 'running') AND `finished_at` IS NULL)
            OR (`status` NOT IN ('pending', 'running') AND `finished_at` IS NOT NULL)),
    ADD CONSTRAINT `data_export_window_ordered`
        CHECK (`expires_at` > `available_at`);

SET @kb_chk := NULL;
SET @kb_sql := NULL;
