/**
 * Floating action button (mobile only). On desktop the app launcher (waffle
 * menu) lives in the header; on mobile that header has no room for it and the
 * per-module bottom nav can't switch apps, so this FAB surfaces the waffle
 * app-launcher bottom-right, above the MobileNav. The module's "New" create
 * actions stay reachable through the off-canvas sidebar drawer.
 */
export default function MobileFab(): import("react").JSX.Element | null;
