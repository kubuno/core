import React from 'react';
export interface SplitterProps {
    /** Exactly two panes; more are ignored. */
    children?: React.ReactNode;
    /** `vertical`: panes side by side (a vertical bar); `horizontal`: one above the other. */
    orientation?: 'vertical' | 'horizontal';
    /** Size of the first pane in px (controlled when given and followed through `onDistanceChange`). */
    distance?: number;
    onDistanceChange?: (distance: number) => void;
    /** Smallest size of either pane, px. */
    minPane?: number;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}
/** Keeps the first pane between `min` and `size − min` (and ≥ 0 when the container is too small). */
export declare function clampDistance(d: number, size: number, min: number): number;
/** The arrow-key step of the bar: 10 px, 50 with Shift. */
export declare const SPLITTER_STEP = 10;
/**
 * Two panes and a bar between them (the `.kbview` `Splitter`). The bar is a focusable `role="separator"` with its
 * value (`aria-valuenow`, the first pane's size): drag it, or use the arrow keys (Shift: bigger steps), Home / End.
 * Side by side, the first pane is at the reading start (it mirrors in RTL).
 */
export declare const Splitter: React.ForwardRefExoticComponent<SplitterProps & React.RefAttributes<HTMLDivElement>>;
