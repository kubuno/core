import type { ReactElement, ReactNode } from 'react';
export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export interface TooltipProps {
    /** Text shown in the bubble. Nothing renders when empty. */
    label: ReactNode;
    /** The element the tooltip describes. Must accept a ref (Radix `asChild`). */
    children: ReactElement;
    side?: TooltipSide;
    /** Distance from the trigger, in px. */
    offset?: number;
    /** Milliseconds before it appears. */
    delay?: number;
    /** Little pointing arrow. Off by default — the reference design has none. */
    arrow?: boolean;
    disabled?: boolean;
}
export declare function Tooltip({ label, children, side, offset, delay, arrow, disabled, }: TooltipProps): ReactElement;
