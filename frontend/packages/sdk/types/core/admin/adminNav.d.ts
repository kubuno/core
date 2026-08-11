import { type LucideIcon } from 'lucide-react';
import { type CanFn } from '../authz/types';
/**
 * How a section spells its address, beyond its own id.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 *
 * The console addresses a place by path: `/admin/users/<id>/security`, but also
 * `/admin/resources/buildings`. The second segment is a RECORD in the first and
 * a PANE in the second, and nothing in the strings themselves says which. The
 * tempting shortcut — "it looks like a UUID, so it is a record" — is a guess
 * about the shape of an identifier, and it holds exactly until the first
 * identifier that is not a UUID (a country code, a module id, a slug), then
 * misreads an address an operator pasted, silently.
 *
 * So each section DECLARES its shape, here, next to the leaf that defines it,
 * and both the URL builder and the URL reader (`adminRoute.ts`) obey the same
 * declaration. Without it the two would eventually parse the same address by
 * two different approximations.
 *
 * ── Rules a declaration must respect ─────────────────────────────────────────
 *
 *  • `panes` is a CLOSED list of stable, untranslated ids (`security`,
 *    `buildings`) — never localised labels: an address may not change shape
 *    with the interface language.
 *  • A record id must never collide with one of the section's pane ids, or
 *    `/admin/<section>/<that-id>` would read as the pane.
 *  • A section that declares nothing keeps its parameters in the query string.
 *    That is a graceful degradation, never a misreading — which is why adding a
 *    pane and forgetting to list it here costs a prettier URL, not correctness.
 */
export interface AdminUrlShape {
    /**
     * Query parameter naming the ONE record the section opens — it becomes the
     * segment right after the section id. A section whose parameters are all
     * filters (`q`, `status`…) declares none.
     */
    entity?: string;
    /**
     * The `pane` values this section addresses, in the path: last segment, after
     * the record when there is one (`/admin/users/<id>/security`), directly after
     * the section when its panes stand alone (`/admin/resources/buildings`).
     */
    panes?: readonly string[];
    /**
     * The panes of THIS section are not knowable at build time — they belong to
     * the record, and the record is discovered at runtime.
     *
     * One section needs this: the installed modules. Each module splits its
     * administration into pages it declares itself (`[[setting_groups]]` in its
     * manifest), so the core cannot list them here without naming modules — the
     * one thing it never does.
     *
     * Why accepting an unlisted pane is SAFE here, and only here: the flag is
     * legal solely on a section that also declares `entity`, and it is honoured
     * ONLY in third position, `/admin/<section>/<record>/<pane>`. At that depth
     * there is nothing left to disambiguate — the record has already claimed the
     * second segment, and a third segment can be nothing but one of its panes.
     * The ambiguity this whole file exists to prevent ("is this segment a record
     * or a pane?") simply cannot arise. The second segment keeps being read
     * exactly as before: the record, never a pane.
     *
     * What is still declared, and what is not: the SHAPE stays declared here (a
     * record, then its panes); only the VOCABULARY of the panes is deferred to
     * the record. The section is therefore responsible for what an unknown pane
     * means — `ModuleAdminPage` falls back to the module's first group rather
     * than painting an empty page for a bookmark that outlived a group.
     */
    dynamicPanes?: boolean;
}
export interface AdminNavItem {
    id: string;
    labelKey: string;
    Icon?: LucideIcon;
    badge?: string;
    soon?: boolean;
    secondary?: boolean;
    children?: AdminNavItem[];
    /**
     * Privilege required to *see* this leaf — the read-level key of whatever the
     * section calls. A leaf without one is visible to any administrator (the
     * landing page). Groups carry none: a group is visible exactly when at least
     * one of its children is.
     */
    priv?: string;
    /**
     * Everything this section puts in the path after its own id. Leaves that
     * address nothing but themselves declare nothing (see `AdminUrlShape`).
     */
    url?: AdminUrlShape;
}
export declare const ADMIN_NAV: AdminNavItem[];
export interface NavMeta {
    item: AdminNavItem;
    ancestors: string[];
    topId: string;
}
export declare const NAV_INDEX: Map<string, NavMeta>;
/** First navigable descendant of a group (groups themselves are not routable). */
export declare const firstLeafOf: (item: AdminNavItem) => string;
/** Same, addressed by id (unknown ids are returned unchanged). */
export declare const firstLeafId: (id: string) => string;
/**
 * Prunes the tree down to what `can` allows.
 *
 * A leaf survives when its `priv` is held (or it declares none); a group
 * survives only when at least one descendant did — an empty group is a heading
 * pointing at nothing. Returns fresh nodes, so `firstLeafOf` on a filtered group
 * lands on a leaf the caller may actually open.
 */
export declare function filterNav(items: AdminNavItem[], can: CanFn): AdminNavItem[];
/**
 * May the caller open this tab? Unknown ids are refused — resolving a tab that
 * is not in the tree would bypass the filter entirely.
 */
export declare function canSeeTab(id: string, can: CanFn): boolean;
/** Full menu path (breadcrumb) to a nav id: ancestor labels + the item's own label. */
export declare function navPathLabels(t: (k: string) => string, id: string): string[];
