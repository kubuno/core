/**
 * The rail of module panels, on the right edge.
 *
 * Hover and focus are CLASSES, not `e.currentTarget.style` mutations. The mutation
 * version bypassed React (the DOM and the render disagreed after any state change),
 * never fired for a keyboard user, and could not be themed — the same reason it was
 * removed from the menus.
 *
 * Tooltips come from `@ui`, not from a local Radix instance. The Radix one rendered
 * a pale bubble at 11px with its own arrow and z-index, which matched nothing else
 * in the app: the house tooltip is a dark bubble at 12px, anchored to the POINTER
 * and clamped to the viewport edges — which matters on a rail sitting against the
 * right border.
 */
export default function RightRail(): import("react").JSX.Element | null;
