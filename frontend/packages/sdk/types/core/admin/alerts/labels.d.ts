import type { TFunction } from 'i18next';
import type { Alert, AlertAction, AlertEventKind, AlertSeverity, AlertStatus } from './types';
export declare const alertTitle: (t: TFunction, a: Alert) => string;
export declare const alertSummary: (t: TFunction, a: Alert) => string;
export declare const kindLabel: (t: TFunction, kind: string) => string;
/**
 * The wording of a button. A health alert's "fix this" action reuses the
 * check's own label for the same reason its title does.
 */
export declare const actionLabel: (t: TFunction, a: AlertAction, alert?: Alert) => string;
export declare const severityLabel: (t: TFunction, s: AlertSeverity) => string;
export declare const statusLabel: (t: TFunction, s: AlertStatus) => string;
export declare const sourceLabel: (t: TFunction, s: string) => string;
export declare const eventLabel: (t: TFunction, k: AlertEventKind) => string;
/**
 * Colour skin of a severity pill.
 *
 * Every class resolves through a theme variable, and **no opacity modifier** is
 * applied to any of them: Tailwind bakes a static light-theme hex next to the
 * `color-mix()` of `/85` and friends, which is exactly the hard-coded colour a
 * dark theme cannot remap.
 */
export declare const SEVERITY_SKIN: Record<AlertSeverity, {
    dot: string;
    chip: string;
}>;
/** A closed alert is painted by its outcome, an open one by its severity. */
export declare const STATUS_SKIN: Record<AlertStatus, string>;
export declare function skinOf(a: Alert): {
    dot: string;
    chip: string;
};
