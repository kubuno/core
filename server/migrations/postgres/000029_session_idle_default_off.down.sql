-- Restore the previous 30-minute inactivity logout default (only if still disabled).
UPDATE core.settings
   SET value       = '30',
       description = NULL
 WHERE key = 'security.session_idle_timeout_min'
   AND value = '0';
