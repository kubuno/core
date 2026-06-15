DELETE FROM core.settings WHERE key IN (
    'security.ddos_enabled',
    'security.ddos_rate_per_min',
    'security.ddos_max_concurrent'
);
