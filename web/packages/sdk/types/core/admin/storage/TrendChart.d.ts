import { type TrendDatum } from './charts';
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
