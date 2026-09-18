import type { ReactNode, RefObject } from 'react';
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
/**
 * A help bubble in the instance's accent, with an arrow pointing at whatever
 * raised the question.
 *
 * It goes on whichever side of the anchor has room — below, above, right, left —
 * and the arrow follows, always on the edge facing the anchor and at the
 * anchor's own centre. Only the tip of the arrow shows, and its point is square.
 */
export declare function HelpBubble({ anchorRef, open, onClose, title, children, okLabel, action, width, prefer }: HelpBubbleProps): import("react").ReactPortal | null;
