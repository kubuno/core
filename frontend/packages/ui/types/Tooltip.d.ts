import type { ReactElement, ReactNode } from 'react';
export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export interface TooltipProps {
    /** Text shown in the bubble. Nothing renders when empty. */
    label: ReactNode;
    /** The element the tooltip describes. Cloned to attach pointer handlers. */
    children: ReactElement;
    /** Kept for compatibility; placement now follows the pointer. */
    side?: TooltipSide;
    /** Milliseconds before it appears. */
    delay?: number;
    disabled?: boolean;
}
/** Shared bubble styling — also used by the shell's `title` interceptor. */
export declare const TOOLTIP_STYLE: React.CSSProperties;
/**
 * The project's tooltip. Modules use THIS (or a plain `title`, which the shell
 * upgrades automatically) rather than the browser's native bubble: the native
 * one cannot be styled, waits a long fixed delay and never shows on touch.
 *
 * It is anchored to the POINTER, not the trigger: below it and left-aligned with
 * it, flipping above when the bottom edge is too close.
 */
export declare function Tooltip({ label, children, delay, disabled }: TooltipProps): import("react").JSX.Element;
