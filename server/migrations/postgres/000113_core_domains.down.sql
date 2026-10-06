-- Aliases reference their parent with ON DELETE RESTRICT, so the table has to
-- go in one statement rather than row by row.
DROP TABLE IF EXISTS core.domains;

DELETE FROM core.setting_values WHERE key = 'auth.registration_domains_only';
DELETE FROM core.settings       WHERE key = 'auth.registration_domains_only';

DELETE FROM core.role_privileges WHERE privilege_key IN ('core.domains.read', 'core.domains.manage');
DELETE FROM core.privileges      WHERE key IN ('core.domains.read', 'core.domains.manage');
