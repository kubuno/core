import { type ReactNode, type RefObject } from 'react';
export type PopoverPlacement = 'bottom' | 'top' | 'left' | 'right';
export type PopoverAlign = 'left' | 'right' | 'center';
/**
 * Where the panel goes (`left` / `top` in the coordinate space): on the `placement` side of the anchor when it fits
 * (else the opposite side), aligned on `align` along that side, clamped `margin` px inside the space.
 */
export declare function placePopover(anchor: {
    left: number;
    top: number;
    right: number;
    bottom: number;
}, panel: {
    width: number;
    height: number;
}, space: {
    width: number;
    height: number;
}, placement: PopoverPlacement, align: PopoverAlign, gap: number, margin?: number): {
    left: number;
    top: number;
};
export declare function AnchoredPopover({ anchorRef, open, onClose, children, gap, align, placement, width, height, lightDismiss, onOpen, }: {
    anchorRef: RefObject<HTMLElement | null>;
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    gap?: number;
    /** Which edges of the popover and the anchor line up (`center`: centred on the anchor). */
    align?: PopoverAlign;
    /** The anchor's side it opens on when there is room (default below). */
    placement?: PopoverPlacement;
    /** Fixed size in px; absent: the content's. */
    width?: number;
    height?: number;
    /** `true` (default): a click outside or Escape closes it (the focus goes back to the anchor on Escape). */
    lightDismiss?: boolean;
    /** Raised once each time it opens. */
    onOpen?: () => void;
}): import("react").ReactPortal | null;
