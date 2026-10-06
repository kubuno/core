/**
 * Feeds the header bell from every module's real-time notifications.
 *
 * ── Why this hook exists ─────────────────────────────────────────────────────
 * The bell is the ONE shared place a signed-in user learns something happened,
 * across all modules. A module must not grow its own bell: it emits a WebSocket
 * `Custom` event whose `event_type` ends in `.notification`, and this hook turns
 * any such event addressed to the current user into a bell entry. Adding a
 * module needs no change here.
 *
 * ── The contract a module emits ──────────────────────────────────────────────
 * A module POSTs an `AppEvent::Custom` to `/internal/events/publish`; the core
 * targets it to `recipient_user_ids` and forwards it, so the browser receives:
 *   `{ type: "event", payload: { type: "Custom", payload: {
 *       event_type: "<module>.notification", module_id,
 *       payload: { recipient_user_ids, notification_id|id, title, body, link?, icon? }
 *   } } }`
 * The core has already restricted delivery to the recipients; the extra check
 * below is defence-in-depth (and picks the browser's active account).
 *
 * ── Rules ────────────────────────────────────────────────────────────────────
 * * **Only mine.** An event not listing the active user is ignored — a broadcast
 *   is not a personal notification.
 * * **Announced once.** `pushKeyed` is keyed on `<module>:<id>`, so a module that
 *   folds several events into one id (an aggregated "5 replies") lands as a
 *   single, non-repeating entry, and a WS replay after a reconnect never re-cries
 *   the same news.
 */
export declare function useModuleNotifications(): void;
