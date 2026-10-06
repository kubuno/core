import type { TFunction } from 'i18next';
import { type LucideIcon } from 'lucide-react';
import { type CanFn } from '../../authz/types';
import { type AdminResult, type AdminResultKind } from './adminSearchIndex';
/**
 * Everything the admin search can find, and the rules that decide what shows.
 *
 * ── Where each category comes from ───────────────────────────────────────────
 *   actions   the static registry (adminActions.ts)
 *   users     the server, debounced — the only source that cannot be held locally
 *   groups    /admin/groups, matched locally
 *   units     /admin/org-units, matched locally
 *   modules   /admin/modules, matched locally
 *   settings  /admin/settings, matched locally (label, key and description)
 *   pages     the navigation tree
 *
 * ── Two deliberate decisions ─────────────────────────────────────────────────
 *
 * NO DEBOUNCE ON LOCAL SOURCES. Debouncing exists to spare the *server*; making
 * a local list wait 200 ms only makes typing feel broken. The server query keeps
 * its debounce, every other category recomputes on the keystroke.
 *
 * PRIVILEGE FIRST, ALWAYS. Every query is `enabled` on the privilege it needs,
 * and every local category is filtered by the same predicate the navigation
 * uses. Not for tidiness: a search that answers "no such user" only when the
 * name is wrong is an enumeration oracle, and a listed setting the caller cannot
 * open still tells them it exists.
 */
/** How many rows each category may contribute. */
export interface Caps {
    action: number;
    user: number;
    group: number;
    module: number;
    setting: number;
    page: number;
    'org-unit': number;
}
export declare const DESKTOP_CAPS: Caps;
/** Mobile is not a narrower desktop: fewer rows, so the list stays one thumb-reach. */
export declare const MOBILE_CAPS: Caps;
export interface SearchSourcesArgs {
    /** Raw field content — local categories use it directly, with no delay. */
    query: string;
    /** Debounced copy, for the server-side user search only. */
    debounced: string;
    /** Fetch at all? False until the operator opens the panel. */
    enabled: boolean;
    can: CanFn;
    isSuperuser: boolean;
    t: TFunction;
    caps: Caps;
}
export interface SearchSources {
    /** Flat, keyboard-ordered result list (already capped and demoted). */
    results: AdminResult[];
    /** Actions offered when the field is empty. */
    suggestions: AdminResult[];
    /** Closest entries when nothing matched — the way out of an empty list. */
    nearMisses: AdminResult[];
    /** A server round trip is still in flight for the current query. */
    usersLoading: boolean;
}
export declare function useAdminSearchSources(args: SearchSourcesArgs): SearchSources;
/** Fallback glyph when a result carries none. */
export declare const KIND_ICON: Record<AdminResultKind, LucideIcon>;
/** Category headings, in paint order. */
export declare const KIND_LABEL_KEY: Record<AdminResultKind, string>;
/** "View all" destination of a category header, when one makes sense. */
export declare const KIND_VIEW_ALL: Partial<Record<AdminResultKind, (q: string) => string>>;
