/**
 * Backward-compatible `getDateLocale()` for modules still built on date-fns.
 *
 * WHY THIS EXISTS
 * The SDK used to export `getDateLocale()`, which returned a date-fns `Locale`
 * for the active language. Removing it was a breaking change of the SDK
 * contract without a version bump: every installed module that imported it,
 * built weeks earlier, failed at import time with "does not provide an export
 * named 'getDateLocale'" and was silently dropped from the shell. The host must
 * keep loading what is installed.
 *
 * WHAT THIS IS
 * A date-fns 4 compatible `Locale` object, built entirely from the platform's
 * `Intl` APIs (no date-fns dependency in the host). It covers what `format`,
 * `parse`, `formatDistance*` and `formatRelative` read from a locale: `localize`,
 * `formatLong`, `match`, `formatDistance`, `formatRelative` and `options`.
 *
 * It is a bridge, not a destination: new code uses the intent-based API of
 * `./datetime` and never touches this file. Once no installed module imports
 * `getDateLocale` any more, delete it together with an SDK version bump.
 */
type Width = 'narrow' | 'short' | 'abbreviated' | 'wide';
type Context = 'formatting' | 'standalone';
type LongWidth = 'full' | 'long' | 'medium' | 'short';
type DayPeriod = 'am' | 'pm' | 'midnight' | 'noon' | 'morning' | 'afternoon' | 'evening' | 'night';
interface LocalizeOptions {
    width?: Width;
    context?: Context;
    unit?: string;
}
interface MatchOptions {
    width?: Width;
    context?: Context;
    valueCallback?: (value: unknown) => unknown;
}
interface MatchResult {
    value: unknown;
    rest: string;
}
interface DistanceOptions {
    addSuffix?: boolean;
    comparison?: number;
}
/** Structural twin of date-fns 4's `Locale`: the host no longer ships date-fns. */
export interface DateFnsLocale {
    code: string;
    formatDistance: (token: string, count: number, options?: DistanceOptions) => string;
    formatRelative: (token: string, date: Date, baseDate: Date, options?: unknown) => string;
    localize: {
        ordinalNumber: (n: number, options?: LocalizeOptions) => string;
        era: (era: number, options?: LocalizeOptions) => string;
        quarter: (quarter: number, options?: LocalizeOptions) => string;
        month: (month: number, options?: LocalizeOptions) => string;
        day: (day: number, options?: LocalizeOptions) => string;
        dayPeriod: (period: DayPeriod, options?: LocalizeOptions) => string;
    };
    formatLong: {
        date: (options?: {
            width?: LongWidth;
        }) => string;
        time: (options?: {
            width?: LongWidth;
        }) => string;
        dateTime: (options?: {
            width?: LongWidth;
        }) => string;
    };
    match: {
        ordinalNumber: (s: string, options?: MatchOptions) => MatchResult | null;
        era: (s: string, options?: MatchOptions) => MatchResult | null;
        quarter: (s: string, options?: MatchOptions) => MatchResult | null;
        month: (s: string, options?: MatchOptions) => MatchResult | null;
        day: (s: string, options?: MatchOptions) => MatchResult | null;
        dayPeriod: (s: string, options?: MatchOptions) => MatchResult | null;
    };
    options: {
        weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
        firstWeekContainsDate: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    };
}
/**
 * @deprecated Modules should format through `formatDate` / `formatRelative`
 * (see `./datetime`) rather than through date-fns. Kept so that modules built
 * against an earlier SDK keep loading.
 */
export declare function getDateLocale(lng?: string): DateFnsLocale;
export {};
