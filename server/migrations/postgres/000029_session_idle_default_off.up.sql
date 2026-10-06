-- Inactivity logout is OFF by default.
--
-- The previous default (30 min) logged users out far too aggressively for a
-- self-hosted personal/family cloud: reading a long document, watching a video,
-- thinking, or leaving the tab in the background for half an hour all triggered a
-- logout (activity is detected only from mouse/keyboard/scroll events). Consumer
-- cloud suites keep sessions alive for weeks; we now do the same — the session is
-- still bounded by the refresh-token TTL (`security.jwt_refresh_ttl_d`, 30 days).
--
-- 0 = disabled (both the backend idle revoke in config/runtime.rs and the frontend
-- useIdleLogout timer treat 0 as "never log out on inactivity"). Admins who want an
-- idle timeout (e.g. shared/kiosk deployments) can set a non-zero value in the admin
-- console. We only flip the value when it is still the untouched factory default, so
-- an admin's explicit choice is never clobbered.
UPDATE core.settings
   SET value       = '0',
       description = 'Déconnexion automatique après inactivité, en minutes (0 = désactivé, défaut). La session reste bornée par la durée du refresh token.'
 WHERE key = 'security.session_idle_timeout_min'
   AND value = '30';
