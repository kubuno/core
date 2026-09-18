DELETE FROM core.settings WHERE key = 'security.login_captcha_after_failures';
DROP TABLE IF EXISTS core.captcha_challenges;
