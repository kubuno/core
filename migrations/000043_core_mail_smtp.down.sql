DELETE FROM core.settings WHERE key IN (
    'mail.smtp_enabled', 'mail.smtp_host', 'mail.smtp_port', 'mail.smtp_security',
    'mail.smtp_username', 'mail.smtp_password', 'mail.from_address', 'mail.from_name',
    'mail.public_url'
);
