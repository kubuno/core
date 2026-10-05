/**
 * Keeps the maintenance banner state in sync from two sources:
 *
 *  - **`/api/v1/config`** — the snapshot read on mount and re-read whenever the
 *    WebSocket (re)connects, so a client that loads mid-operation, or that missed
 *    events while offline, shows the true state.
 *  - **the `maintenance` WebSocket channel** — real-time `start`/`end` events
 *    that add or remove a banner the instant an operation begins or ends.
 *
 * Mount it once, high in the shell.
 */
export declare function useMaintenanceNotices(): void;
