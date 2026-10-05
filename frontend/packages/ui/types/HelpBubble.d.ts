/**
 * A help bubble in the instance's accent, with an arrow pointing at whatever
 * raised the question.
 *
 * ## Why not a plain popover
 *
 * A white card on a white panel is another panel: it reads as more of the form
 * rather than as an answer to the question just asked. A filled bubble reads as
 * a remark someone made — it is plainly not part of the page — and the arrow
 * says which control it is about, which a floating card never does. That
 * matters most where several little "?" sit near each other.
 *
 * ## It goes on whichever side has room
 *
 * Below the anchor by default, then above it, then to the right, then to the
 * left: the first side that actually fits, and failing that the roomiest. The
 * arrow follows — it is always on the edge facing the anchor, at the anchor's
 * own centre. Near a screen edge the bubble is pushed back into view and the
 * arrow keeps pointing, held only far enough from the corner not to straddle
 * the rounding.
 *
 * Only the TIP of the arrow shows. A rotated square pokes out by its
 * half-diagonal if you let it, which is a whole wedge; the offset here accounts
 * for what the rotation adds, so the amount that shows is the amount asked for.
 * Its corners are square — the one that sticks out IS the point.
 */
import { type ReactNode, type RefObject } from 'react';
export type HelpBubbleSide = 'top' | 'right' | 'bottom' | 'left';
export interface HelpBubbleProps {
    /** The control the help is about. The arrow points at its centre. */
    anchorRef: RefObject<HTMLElement | null>;
    open: boolean;
    onClose: () => void;
    /** The bold opening line. Optional: a bubble may be one paragraph. */
    title?: ReactNode;
    children: ReactNode;
    /** Label for the dismiss button. Defaults to "OK". */
    okLabel?: ReactNode;
    /** An optional second action, shown to the left of the dismiss button. */
    action?: {
        label: ReactNode;
        onClick: () => void;
    };
    width?: number;
    /** Where to try first. The order after it is always bottom → top → right → left. */
    prefer?: HelpBubbleSide;
}
export declare function HelpBubble({ anchorRef, open, onClose, title, children, okLabel, action, width, prefer, }: HelpBubbleProps): import("react").ReactPortal | null;
