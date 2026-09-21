DROP TABLE IF EXISTS core.acme_state;

DELETE FROM core.settings WHERE key IN (
    'network.acme_directory_url',
    'network.acme_email',
    'network.acme_domains',
    'network.acme_tos_agreed'
);
