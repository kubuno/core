/**
 * Floating action button (mobile only). On desktop the "New" action lives in the
 * sidebar; on mobile that sidebar is an off-canvas drawer, so the primary create
 * action would be two taps away and hidden. This FAB surfaces the exact same
 * create actions (the active module's `NewActions` component or its
 * `sidebar-new-actions` slot) bottom-right, above the MobileNav.
 */
export default function MobileFab(): import("react").JSX.Element | null;
