import type { AdminResult, AdminResultKind } from './adminSearchIndex';
export interface RecentTarget {
    kind: AdminResultKind;
    label: string;
    sublabel?: string;
    url: string;
}
export declare function readRecents(userId: string | null | undefined): RecentTarget[];
/** Records a visit, most recent first, de-duplicated on the destination URL. */
export declare function pushRecent(userId: string | null | undefined, result: AdminResult): RecentTarget[];
/**
 * The section a stored URL points at, or null when it addresses the landing page.
 *
 * Reads the path first (`/admin/users`) and falls back to the historic `?tab=`
 * form, because the list is persisted in localStorage: an operator's recents
 * were minted by the previous build and must not all resolve to the landing.
 */
export declare function recentTab(url: string): string | null;
