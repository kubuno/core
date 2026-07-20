/**
 * Primary mobile navigation. Two placements share one set of destinations:
 *  · `variant="bottom"` (default) — a fixed bottom bar, used in portrait.
 *  · `variant="rail"` — a vertical left rail rendered in the shell's flex flow,
 *    used in landscape where a bottom bar would eat the already-short height
 *    (mirrors the Google Drive tablet/landscape layout).
 *
 * Destinations come from the active module's `mobileTabs` (Drive: Home /
 * Starred / Shared / Files) and fall back to the shell's generic ones. Modules
 * never render their own bar — that would stack two of them.
 */
export default function MobileNav({ variant }: {
    variant?: 'bottom' | 'rail';
}): import("react").JSX.Element;
