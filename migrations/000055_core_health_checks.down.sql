DELETE FROM core.settings WHERE key = 'mail.last_test_ok_at';

DROP TABLE IF EXISTS core.health_check_mutes;
