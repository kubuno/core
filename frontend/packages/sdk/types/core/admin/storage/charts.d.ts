import { type ReactNode } from 'react';
/**
 * Slots of the categorical scale, in fixed order. Never cycled.
 *
 * Written out in full rather than composed from an index: Tailwind prunes
 * `@theme` variables it cannot see referenced in the source, so a name built at
 * runtime (`--kb-chart-${n}`) resolves to a variable that was never emitted.
 *
 * The dark steps are a separate, separately-validated set rather than a filter
 * over the light ones, and the choice is made in JS: Kubuno's themes are applied
 * by writing variables from the theme store, not through `prefers-color-scheme`,
 * so a CSS-only switch would stay light on a hand-picked dark theme.
 */
export declare const SERIES_LIGHT: readonly ["var(--kb-chart-1)", "var(--kb-chart-2)", "var(--kb-chart-3)", "var(--kb-chart-4)", "var(--kb-chart-5)", "var(--kb-chart-6)", "var(--kb-chart-7)", "var(--kb-chart-8)"];
export declare const SERIES_DARK: readonly ["var(--kb-chart-1-dark)", "var(--kb-chart-2-dark)", "var(--kb-chart-3-dark)", "var(--kb-chart-4-dark)", "var(--kb-chart-5-dark)", "var(--kb-chart-6-dark)", "var(--kb-chart-7-dark)", "var(--kb-chart-8-dark)"];
/** Beyond this many series, the tail folds into one entry. Never a ninth hue. */
export declare const MAX_SERIES: 8;
/** The scale for the theme actually in force. */
export declare function useSeriesScale(): readonly string[];
/** The colour of what has no identity: a residual, a fold, an unknown. */
export declare const NEUTRAL_SERIES = "var(--color-border-strong)";
export interface Segment {
    id: string;
    label: string;
    value: number;
    /** A CSS colour *expression* — always `var(--…)`, never a literal. */
    color: string;
    /**
     * The remainder, not a part: it is left as bare track rather than painted.
     *
     * "Free space" is what the bar has not filled, and painting it in a near-track
     * grey produces two adjacent light greys nobody can tell apart. It keeps its
     * legend entry — the number is the point — with a hairline ring so the swatch
     * is visible against the card.
     */
    track?: boolean;
}
/**
 * One horizontal bar split into parts of a whole, with its legend underneath.
 *
 * Used for the two part-to-whole readings the page has real numbers for: what
 * fills the data volume, and how the accounts split across quota states. A
 * segment narrower than the gap is dropped from the bar rather than rendered as
 * a sliver that reads as a rendering artefact — its number stays in the legend,
 * which is where it is read anyway.
 */
export declare function CompositionBar({ segments, total, ariaLabel, format, }: {
    segments: Segment[];
    total: number;
    ariaLabel: string;
    format?: (n: number) => string;
}): import("react").JSX.Element;
export interface TrendDatum {
    day: string;
    value: number;
}
/**
 * A single-series line over time. No legend — one series, and the card title
 * already names it.
 *
 * Days with no sample are absent from `data` rather than zero-filled: a core
 * that was switched off for a week measured nothing that week, and drawing a
 * dip to zero would report a mass deletion that never happened. Points are laid
 * out by their **date**, so a gap in the samples is a gap on the axis.
 */
export declare function TrendChart({ data, height, label, }: {
    data: TrendDatum[];
    height?: number;
    label: string;
}): import("react").JSX.Element;
/** A figure and its caption, side by side, for the row under a chart. */
export declare function Figure({ label, children }: {
    label: string;
    children: ReactNode;
}): import("react").JSX.Element;
