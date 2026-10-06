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
/**
 * A CSS colour expression → the literal the canvas can paint.
 *
 * Accepts either a literal (returned as-is) or a single `var(--token)`. The
 * resolved value is a 6-digit hex in every theme Kubuno ships, which is what
 * lets the callers below append an alpha pair to it.
 */
export declare function resolveColor(el: Element | null, color: string): string;
/** The chrome every canvas chart paints: grid, tick labels, surface. */
export declare function chartInk(el: Element | null): {
    grid: string;
    label: string;
    surface: string;
};
/** Octets → chaîne lisible (Ko/Mo/Go…). */
export declare function fmtBytes(n: number): string;
export declare function axisTicks(max: number): {
    top: number;
    ticks: number[];
};
export declare function useWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number;
export declare const PAD: {
    l: number;
    r: number;
    t: number;
    b: number;
};
