import type { TFunction } from 'i18next';
import type { HealthCheck, HealthSeverity, HealthStatus } from './types';
export declare const checkTitle: (t: TFunction, c: HealthCheck) => string;
export declare const checkWhy: (t: TFunction, c: HealthCheck) => string;
export declare const checkActionLabel: (t: TFunction, c: HealthCheck) => string;
/**
 * The observed value, in the reader's language.
 *
 * Numeric arguments are pre-formatted here rather than in thirteen catalogues:
 * a byte count must read as "12,4 Go" and a timestamp as a local date, and no
 * i18n string should have to know that.
 */
export declare function checkValue(t: TFunction, c: HealthCheck, locale: string): string;
export declare const statusLabel: (t: TFunction, s: HealthStatus) => string;
export declare const severityLabel: (t: TFunction, s: HealthSeverity) => string;
export declare const blockLabel: (t: TFunction, b: string) => string;
/**
 * Colour skin of a status pill.
 *
 * Every class resolves through a theme variable, and no opacity modifier is
 * applied to any of them: Tailwind bakes a STATIC light-theme hex next to the
 * `color-mix()` of `/85` and friends, which is exactly the hard-coded colour a
 * dark theme cannot remap.
 */
export declare const STATUS_SKIN: Record<HealthStatus, {
    dot: string;
    chip: string;
}>;
/** A failing check is painted by its SEVERITY, not by the fact that it failed. */
export declare const SEVERITY_SKIN: Record<HealthSeverity, {
    dot: string;
    chip: string;
}>;
/** Pill skin for one check: severity while it is failing, status otherwise. */
export declare function skinOf(c: HealthCheck): {
    dot: string;
    chip: string;
};
