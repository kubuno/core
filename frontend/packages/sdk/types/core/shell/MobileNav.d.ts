/**
 * Primary mobile navigation. Two placements share one set of destinations:
 *  · `variant="bottom"` (default) — a fixed bottom bar, used in portrait.
 *  · `variant="rail"` — a vertical left rail rendered in the shell's flex flow,
 *    used in landscape where a bottom bar would eat the already-short height
 *    (mirrors the Google Drive tablet/landscape layout).
 *
 * Destinations come from the active module's `mobileTabs` (Drive: Home /
 * Starred / Shared / Files). NO fallback: outside a module that declares tabs
 * there is no bar at all (the drawer + waffle FAB carry the navigation) — a
 * generic Home/Modules/Settings bar was pure clutter. Modules never render
 * their own bar — that would stack two of them.
 */
export default function MobileNav({ variant }: {
    variant?: 'bottom' | 'rail';
}): import("react").JSX.Element | null;
