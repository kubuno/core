import type { PanelBucket } from './types';
/**
 * The AXIS label: as short as it can be while still being unambiguous inside
 * one window. Ten of these sit side by side under a chart.
 */
export declare function bucketLabel(iso: string, bucket: PanelBucket, locale: string): string;
/**
 * The TABLE label: the whole instant, spelt out.
 *
 * A report is read away from the page that produced it — months later, on paper,
 * by somebody who did not choose the window. "03/03" is enough under a chart
 * whose period is stated above it and useless in a column somebody photocopied,
 * so the row carries the year and, for a week, says that it is a week.
 *
 * `weekOf` is the caller's translated "semaine du {{date}}"; it is passed in
 * rather than looked up here so this module stays free of the i18n runtime.
 */
export declare function bucketFullLabel(iso: string, bucket: PanelBucket, locale: string, weekOf: (date: string) => string): string;
