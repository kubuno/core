DELETE FROM core.settings WHERE key LIKE 'network.%';

DROP INDEX IF EXISTS core.idx_core_tls_not_after;
DROP INDEX IF EXISTS core.uq_core_tls_active;
DROP TABLE IF EXISTS core.tls_certificates;
