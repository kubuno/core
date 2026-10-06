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
