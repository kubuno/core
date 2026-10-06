import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
export type ProgressVariant = 'auto' | 'primary' | 'success' | 'warning' | 'danger';
export interface ProgressBarProps {
    value: number;
    /** Denominator. Defaults to 100, i.e. `value` read as a percentage. */
    max?: number;
    /**
     * `auto` (default) colours the fill from the thresholds below — the behaviour
     * every hand-rolled quota bar in the admin was re-implementing, each with its
     * own hard-coded `#d93025`. Pass an explicit variant to pin a colour (a
     * download bar is not "dangerous" at 95 %).
     */
    variant?: ProgressVariant;
    label?: ReactNode;
    /** Prints the numeric value opposite the label. */
    showValue?: boolean;
    /** Formats that value. Default: rounded percentage. */
    formatValue?: (value: number, max: number) => string;
    /** Fraction (0-1) at which `auto` turns warning / danger. */
    warnAt?: number;
    dangerAt?: number;
    size?: 'sm' | 'md';
    /** Unknown progress: an animated sliver instead of a fill. `value` is ignored. */
    indeterminate?: boolean;
    className?: string;
    t?: TFunction;
}
/**
 * ProgressBar — one bar for quotas, uploads, indexing and any bounded task.
 *
 * Thresholds are the point of the component: a storage bar must go amber before
 * it goes red, and it must do so at the SAME ratio everywhere. They default to
 * 75 % (warning) and 90 % (danger), and are overridable per instance rather than
 * re-derived at each call site.
 *
 * Colours come from `bg-primary` / `bg-warning` / `bg-danger`, so a theme
 * remapping those variables recolours every bar — including in dark mode, where
 * the hard-coded `#d93025` of the current admin bars reads far too heavy.
 */
export declare function ProgressBar({ value, max, variant, label, showValue, formatValue, warnAt, dangerAt, size, indeterminate, className, t, }: ProgressBarProps): import("react").JSX.Element;
