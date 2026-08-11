/**
 * Feeds the header bell from the alert centre.
 *
 * ── Why this hook exists ─────────────────────────────────────────────────────
 * `notificationStore` was purely client-side: a `push()` API with **no backend
 * and no producer**, so the bell had been empty since it was written. This is
 * its first producer, and it is the one that matters — the bell is where an
 * operator learns something is wrong without opening the console.
 *
 * ── The rules it respects ────────────────────────────────────────────────────
 * * **Only holders of `core.alerts.read` ask.** The bell renders for every
 *   signed-in user; firing a 403 per page load for everybody else is the exact
 *   pattern this codebase already removed once from the privileges resolution.
 * * **Announced once.** `pushKeyed` is keyed on the alert id, so a queue polled
 *   every minute does not re-cry the same news — including after the reader
 *   dismissed it.
 * * **Only what is new.** An acknowledged alert has an owner; telling everybody
 *   again is how a bell becomes noise.
 * * **The store's cap is untouched** (50, newest first): the feed pushes, it
 *   does not manage the list.
 */
export declare function useAlertFeed(): void;
