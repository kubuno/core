export declare const CHART_COLORS: string[];
/**
 * The categorical scale, as theme VARIABLES rather than literals.
 *
 * `CHART_COLORS` above is the historical literal set, still used by the general
 * dashboard. Anything drawn for both themes takes this one instead: the dark
 * steps are a separately-validated set, not a filter over the light ones, and
 * the choice is made in JS because Kubuno applies themes by writing variables,
 * not through `prefers-color-scheme` (see `theme.css`).
 */
export declare const CHART_SERIES_LIGHT: readonly ["var(--kb-chart-1)", "var(--kb-chart-2)", "var(--kb-chart-3)", "var(--kb-chart-4)", "var(--kb-chart-5)", "var(--kb-chart-6)", "var(--kb-chart-7)", "var(--kb-chart-8)"];
export declare const CHART_SERIES_DARK: readonly ["var(--kb-chart-1-dark)", "var(--kb-chart-2-dark)", "var(--kb-chart-3-dark)", "var(--kb-chart-4-dark)", "var(--kb-chart-5-dark)", "var(--kb-chart-6-dark)", "var(--kb-chart-7-dark)", "var(--kb-chart-8-dark)"];
/** The categorical scale for the theme actually in force. */
export declare function useChartSeries(): readonly string[];
/** Octets → chaîne lisible (Ko/Mo/Go…). */
export declare function fmtBytes(n: number): string;
export declare function BarChart({ data, color, height, unit, }: {
    data: {
        label: string;
        value: number;
    }[];
    color?: string;
    height?: number;
    unit?: string;
}): import("react").JSX.Element;
export declare function AreaChart({ data, color, height, unit, }: {
    data: {
        label: string;
        value: number;
    }[];
    color?: string;
    height?: number;
    unit?: string;
}): import("react").JSX.Element;
export declare function ProgressRing({ pct, label, value, sub, color, size, }: {
    pct: number;
    label?: string;
    value: string;
    sub?: string;
    color?: string;
    size?: number;
}): import("react").JSX.Element;
export declare function DonutChart({ data, centerValue, centerLabel, size, }: {
    data: {
        label: string;
        value: number;
        color: string;
    }[];
    centerValue?: string;
    centerLabel?: string;
    size?: number;
}): import("react").JSX.Element;
export declare function HBarList({ items, color, }: {
    /** `color` per item overrides the list's own — a printed report ties each bar
        to the slice and to the table row that carry the same entry. */
    items: {
        label: string;
        value: number;
        max: number;
        sub?: string;
        color?: string;
    }[];
    color?: string;
}): import("react").JSX.Element;
/**
 * The same series as {@link BarChart} and {@link AreaChart}, drawn in SVG.
 *
 * ## Why a second implementation, and only for reports
 *
 * A `<canvas>` is a BITMAP composited at draw time. Two consequences a printed
 * report cannot live with:
 *
 *   • It resolves its theme variables when it paints (see the note at the top of
 *     this file). Under a dark theme the axis labels are painted in the dark
 *     theme's pale ink — and printing does not repaint a canvas, so a print
 *     stylesheet forcing black text has no effect whatsoever on it. The chart
 *     comes out as pale grey on white, or invisible.
 *   • It is rasterised at the screen's pixel ratio, then scaled to the printer's
 *     much higher one. A 132-pixel-tall chart enlarged to a page width prints
 *     visibly soft.
 *
 * SVG has neither problem: it is part of the document, so `@media print` reaches
 * it, and it is resolution-independent. The interactive charts stay on canvas —
 * they are hovered, animated and redrawn constantly, which is the one thing
 * canvas is better at — and reports take this one.
 *
 * ## No measurement, deliberately
 *
 * There is no `ResizeObserver` here. The drawing is laid out in a fixed
 * `viewBox` and scaled by CSS, so it needs no width to render — which matters
 * because the browser lays a page out again for the printer, and a chart that
 * waits for an observer to fire can be measured at zero on the sheet it is being
 * printed onto.
 */
export declare function ReportSeriesChart({ data, color, shape, unit, }: {
    data: {
        label: string;
        value: number;
    }[];
    color?: string;
    /** `bars` for counts of discrete events, `area` for continuous activity. */
    shape?: 'bars' | 'area';
    /** Spells a value in the panel's own unit (counts, or bytes). */
    unit?: (v: number) => string;
}): import("react").JSX.Element | null;
export declare function Sparkline({ data, color, width, height }: {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
}): import("react").JSX.Element | null;
