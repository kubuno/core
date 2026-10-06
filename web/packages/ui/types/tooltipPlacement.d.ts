/**
 * Where the project's tooltip goes: BELOW the mouse pointer and aligned with it
 * on the left, whenever there is room. That is the house rule — it keeps the
 * bubble out of the way of what the pointer is over, and reading always starts
 * at the same spot as the cursor.
 *
 * Falls back gracefully: above the pointer when the bottom edge is too close,
 * and shifted left when the bubble would run past the right edge.
 */
export interface TooltipPlacement {
    left: number;
    top: number;
    /** Which side of the pointer the bubble ended up on. */
    below: boolean;
}
export declare const TOOLTIP_GAP = 14;
export declare function placeTooltip(pointerX: number, pointerY: number, size: {
    width: number;
    height: number;
}, viewport?: {
    width: number;
    height: number;
}): TooltipPlacement;
