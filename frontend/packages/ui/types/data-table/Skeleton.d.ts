import type { TFunction } from 'i18next';
/**
 * Loading state — a SKELETON, not a spinner.
 *
 * A spinner says "something is happening somewhere"; a skeleton says "a table
 * with these columns is arriving here", so the layout does not jump when the
 * rows land and the eye already knows where to look. Widths vary per column so
 * the placeholder reads as text rather than as a bar chart.
 *
 * The whole block is `aria-hidden` behind a single polite status message: a
 * screen reader has nothing to gain from forty grey rectangles.
 */
export declare function DataTableSkeleton({ columns, rows, selectable, t }: {
    columns: number;
    rows?: number;
    selectable?: boolean;
    t?: TFunction;
}): import("react").JSX.Element;
