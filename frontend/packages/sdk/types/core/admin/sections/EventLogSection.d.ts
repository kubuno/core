/**
 * Module event bus (`core.event_log`), 30-day retention.
 *
 * NOT the administrative audit trail: entries here have no actor and record
 * what the SYSTEM did (a file uploaded, an event created), whereas the audit
 * trail records who changed the configuration. Both screens live under
 * "Reporting" and are routinely confused, hence the callout.
 *
 * ── What the route actually offers ───────────────────────────────────────────
 * `GET /admin/event-log` accepts `limit` (≤ 200), `offset` and an EXACT
 * `event_type`. It returns no total and no cursor, so:
 *   • pagination is "load more" over `offset` — a page count would be a lie
 *     without a total, and a page *selector* would let the user jump into a
 *     window whose size nobody knows;
 *   • the type filter is fed from the types actually seen in what has been
 *     loaded (the route exposes no facets endpoint), which is stated in the UI
 *     rather than passed off as an exhaustive catalogue.
 */
export default function EventLogSection(): import("react").JSX.Element;
