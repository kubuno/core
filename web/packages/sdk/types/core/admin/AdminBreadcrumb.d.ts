import { type Crumb } from '@ui';
/**
 * Appends segments while a detail view is on screen — "Marie Dupont" under
 * Utilisateurs, "exemple.fr" under Domaines.
 *
 * Cleared on unmount, and that is the whole contract: a trail left behind by a
 * sheet somebody closed would claim they are somewhere they are not. Pass a
 * stable array (or memoise it) — the effect re-runs on identity change.
 */
export declare function useAdminCrumbs(extra: Crumb[]): void;
export default function AdminBreadcrumb({ tab }: {
    tab: string;
}): import("react").JSX.Element | null;
