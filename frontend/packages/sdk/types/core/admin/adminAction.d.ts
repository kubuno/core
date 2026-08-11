import { adminUrlWith, type AdminUrlTarget } from './adminRoute';
/**
 * ── Deep actions in the admin URL ────────────────────────────────────────────
 *
 * A tab is a *place*; an action is a *verb*. The console addresses both with one
 * convention, so that anything — the search bar, a health check, an e-mail, an
 * audit row — can link straight to the surface that performs the task instead of
 * dropping the operator on a page and leaving them to find the button.
 *
 *     /admin/<section>[/<record>[/<pane>]]?action=<verb>[&id=<resource>]
 *
 * ── Producing one ────────────────────────────────────────────────────────────
 *
 *     import { adminUrl } from './adminAction'
 *     navigate(adminUrl({ tab: 'users', action: 'create' }))
 *     navigate(adminUrl({ tab: 'modules', action: 'settings', id: 'drive' }))
 *     navigate(adminUrl({ tab: 'users', action: 'reset-password', id: userId,
 *                         params: { user: userId, pane: 'security' } }))
 *
 * ── Consuming one ────────────────────────────────────────────────────────────
 *
 * The section that owns the surface claims the verb — nobody else has to know it
 * exists:
 *
 *     useAdminAction('create', () => setShowCreate(true))
 *     useAdminAction('settings', id => setSettingsFor(modules.find(m => m.id === id) ?? null))
 *
 * The handler runs ONCE per navigation, and the hook then strips `action` and
 * `id` from the query string with a history *replacement*. Two reasons, both
 * load-bearing: the address bar stops advertising a verb that has already run
 * (a reload would re-fire it), and the browser's Back button returns to where
 * the operator came from rather than replaying the action.
 *
 * A claim is keyed on `<verb>:<id>`, so navigating to the same verb twice in a
 * row (same tab, different resource) fires twice, as one would expect, while a
 * re-render never does.
 */
/** What a caller may address. Defined in `adminRoute.ts`, re-exported here. */
export type AdminActionTarget = AdminUrlTarget;
/**
 * Builds the canonical URL of a target — the single place an admin address is
 * spelt. A caller says WHAT it means (`params: { user: id, pane: 'security' }`)
 * and never where each piece lands: which parameters become path segments is
 * decided by the section's declaration in `adminNav.ts`, read by `adminRoute.ts`.
 * A hand-written `/admin/...` string elsewhere is the next divergence waiting to
 * happen.
 */
export declare function adminUrl(target: AdminActionTarget): string;
/** "Same place, with these parameters changed" — see `adminRoute.ts`. */
export { adminUrlWith };
/**
 * Claims `verb` for the calling section: runs `handler` once when the URL asks
 * for it, then clears the parameters (history replacement).
 *
 * `handler` is read through a ref, so a caller may pass an inline closure
 * without making the effect re-fire on every render.
 */
export declare function useAdminAction(verb: string, handler: (id: string | null) => void): void;
