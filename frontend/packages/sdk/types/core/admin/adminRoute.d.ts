import { type AdminUrlShape } from './adminNav';
/**
 * ── The shape of an administration address ───────────────────────────────────
 *
 * A PLACE goes in the path; everything else goes in the query string:
 *
 *     /admin                                  the landing
 *     /admin/users                            a section (an `id` of ADMIN_NAV)
 *     /admin/users/<id>                       that section, one record open
 *     /admin/users/<id>/security              …on one of the record's panes
 *     /admin/resources/buildings              a section whose panes have no record
 *     /admin/users/<id>/security?action=reset-password
 *
 * What stays a parameter is what identifies no place: a filter (`q`, `filter`,
 * `status`, `severity`, `kind`, `assignee`), a highlight, a verb (`action`,
 * `id`).
 *
 * ── Why each section DECLARES its shape ──────────────────────────────────────
 *
 * The second segment is an id in `/admin/users/<uuid>` and a pane in
 * `/admin/resources/buildings`. Nothing in those two strings says which — and
 * guessing from the shape of the segment ("it looks like a UUID, so it is an
 * id") holds exactly until the first identifier that is not a UUID, then fails
 * silently on a URL an operator pasted.
 *
 * So the answer is not inferred, it is declared: every section that puts
 * anything after its own id carries an `url` block in `adminNav.ts` — the name
 * of its entity parameter, and the CLOSED list of its pane ids. Reading and
 * writing both go through this module, which reads that declaration; a section
 * that declares nothing simply keeps its parameters in the query string, which
 * is a degradation, never a misreading.
 *
 * Two rules the declaration must respect (both stated in `adminNav.ts`):
 *   • pane ids are stable, untranslated identifiers (`security`, `buildings`) —
 *     an address may not change shape with the interface language;
 *   • no record id may collide with one of the section's pane ids.
 *
 * ── Panes that belong to the record ──────────────────────────────────────────
 *
 * One section addresses panes it cannot enumerate: an installed module splits
 * its administration into pages IT declares (`/admin/modules/mail/filtering`),
 * and the core never knows a module by name. Such a section declares
 * `dynamicPanes: true` next to its `entity`, and the third segment is then
 * taken as a pane whatever it spells.
 *
 * That is still declaring rather than guessing: the shape — a record, then its
 * panes — is what the section states, and the flag only says whose vocabulary
 * fills the last segment. It cannot misread anything, because it is honoured in
 * THIRD position only: the record has already claimed the second segment, so no
 * "record or pane?" question is left to answer. And because a pane read this way
 * may name a page that no longer exists, the section owes a fallback (see
 * `ModuleAdminPage`) — never a blank screen.
 *
 * ── One builder, one reader ──────────────────────────────────────────────────
 *
 * `adminUrl()` is the only place an admin address is spelt: a caller passes
 * `params: { user: id, pane: 'security' }` and never has to know where those two
 * land. `useAdminParams()` does the reverse for the sections, republishing the
 * path segments under their parameter names — so a section keeps asking for
 * `params.get('user')` and knows nothing of any of this.
 *
 * ── Historic addresses ───────────────────────────────────────────────────────
 *
 * `/admin?tab=users&user=<id>&pane=security` is minted in alerts, in e-mails and
 * in operators' bookmarks. `AdminPage` rewrites any non-canonical spelling to
 * the canonical one (`canonicalAdminUrl`) with a history REPLACEMENT — an
 * addition would make the Back button bounce between the two forever.
 */
/** The landing section — the one that owns `/admin` itself, with no segment. */
export declare const ADMIN_HOME = "home";
/** Root of the console. */
export declare const ADMIN_ROOT = "/admin";
/** How `tab` spells its address, as declared next to the menu leaf. */
export declare const urlShapeOf: (tab: string) => AdminUrlShape | null;
/** What a `/admin/...` pathname says, once read through the section's declaration. */
export interface AdminPlace {
    tab: string;
    entity: string | null;
    pane: string | null;
}
/**
 * Reads a pathname into a place.
 *
 * A segment the declaration does not account for is DROPPED rather than
 * guessed at — `canonicalAdminUrl` then rewrites the address without it, so a
 * malformed URL heals into a valid one instead of rendering something nobody
 * asked for.
 */
export declare function placeFromPath(pathname: string): AdminPlace;
/** The section a pathname addresses (the landing when it addresses none). */
export declare const tabFromPath: (pathname: string) => string;
/**
 * Path of a place. The caller passes what it means; where each piece lands is
 * decided here, from the section's declaration.
 */
export declare function adminPath(tab?: string | null, entity?: string | null, pane?: string | null): string;
/** Everything a caller may want to address, as one object. */
export interface AdminUrlTarget {
    /** Navigable leaf of ADMIN_NAV. `home` addresses `/admin`. */
    tab: string;
    /** The verb. Omitted for a target that is a place, not a task. */
    action?: string;
    /** The resource the verb applies to, when it needs one. */
    id?: string;
    /** What the destination reads — `user`, `pane`, `q`… Placed by the declaration. */
    params?: Record<string, string | number | null | undefined>;
}
/**
 * Builds the canonical URL of a target — the single place an admin address is
 * spelt. See `adminUrl` in adminAction.ts, which is the name callers use.
 */
export declare function buildAdminUrl(target: AdminUrlTarget): string;
/**
 * The address you are at, with a few parameters changed — "stay here, but open
 * that record" / "switch pane". A `null` (or empty) value drops the parameter.
 *
 * Sections used to spell this by hand (`new URLSearchParams(params)`, then
 * `/admin?…`), which is precisely how a section keeps writing a URL form the
 * console has moved on from.
 */
export declare function adminUrlWith(tab: string, current: URLSearchParams, changes: Record<string, string | number | null | undefined>): string;
/** The section currently on screen, read from the path. */
export declare function useAdminTab(): string;
/**
 * The whole place currently on screen — section, open record, pane.
 *
 * What `useAdminTab` gives is enough to highlight a menu SECTION; a menu that
 * also lists records (the installed modules under Applications) has to tell
 * `/admin/modules` from `/admin/modules/drive`, which is the record this reads.
 */
export declare function useAdminPlace(): AdminPlace;
/**
 * What a section reads: the query string, plus the path segments republished
 * under the parameter names the section already asks for.
 *
 * One translation, here, instead of every section learning where its id is
 * spelt — which is what keeps `params.get('user')` working unchanged.
 */
export declare function useAdminParams(): URLSearchParams;
/** Non-hook form of `useAdminParams`, for callers that already hold both. */
export declare function sectionParams(pathname: string, search: URLSearchParams): URLSearchParams;
export declare function canonicalAdminUrl(pathname: string, search: URLSearchParams): string | null;
