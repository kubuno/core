/**
 * Dates and times, in house, on top of the platform's own `Intl`.
 *
 * WHY THIS EXISTS
 * Seventeen repositories depended on `date-fns`, and one file here imported
 * thirteen of its locale bundles so that month and weekday names came out in the
 * user's language. The browser already knows all of that: `Intl.DateTimeFormat`
 * and `Intl.RelativeTimeFormat` are localised for every language we ship, weigh
 * nothing, and are maintained by the platform rather than by us.
 *
 * WHAT CHANGES FOR CALLERS, AND WHY IT IS AN IMPROVEMENT
 * A hard-coded pattern is replaced by an INTENT — `formatDate(d, 'date')`.
 * A hard-coded pattern is a localisation bug in a product shipped in thirteen
 * languages: it prints 03/09/2026 to a reader who expects 2026/09/03 or
 * ٢٠٢٦/٩/٣. Saying *what* the date is for, and letting the platform decide how
 * to write it, is both shorter and correct.
 *
 * Anything the presets do not cover takes raw `Intl` options, so nothing is
 * locked away behind our own vocabulary.
 */
export type DateInput = Date | string | number;
/** Named intents, resolved per language. Covers what the call sites actually did. */
export type DatePreset = 'date' | 'dateShort' | 'dateLong' | 'weekday' | 'weekdayDate' | 'month' | 'monthYear' | 'time' | 'timeSeconds' | 'dateTime' | 'weekdayNarrow' | 'weekdayShort' | 'weekdayTime' | 'hour';
/** Dropped when the language changes, so nothing keeps printing in the old one. */
export declare function resetDateFormatters(): void;
/**
 * Accepts what an API actually returns: an ISO string, a timestamp, a Date.
 *
 * An ISO string goes straight to `new Date`, which parses that format natively —
 * this is what `parseISO` was doing for us.
 */
export declare function toDate(value: DateInput): Date;
/** True when the value cannot be read as a date — checked before printing it. */
export declare function isValidDate(value: DateInput): boolean;
/**
 * The date as the reader's language writes it.
 *
 * An unreadable value yields an empty string rather than "Invalid Date" in the
 * middle of an interface.
 */
export declare function formatDate(value: DateInput, shape?: DatePreset | Intl.DateTimeFormatOptions): string;
/**
 * "il y a 3 heures", "dans 2 jours" — localised by the platform.
 *
 * `numeric: 'auto'` is what turns "il y a 1 jour" into "hier", which is the
 * whole point of using the platform rather than counting units ourselves.
 */
export declare function formatRelative(value: DateInput, now?: DateInput): string;
export declare function addDays(value: DateInput, days: number): Date;
export declare function addMonths(value: DateInput, months: number): Date;
export declare function addYears(value: DateInput, years: number): Date;
export declare function addMinutes(value: DateInput, minutes: number): Date;
export declare function startOfDay(value: DateInput): Date;
export declare function endOfDay(value: DateInput): Date;
export declare function startOfMonth(value: DateInput): Date;
export declare function startOfYear(value: DateInput): Date;
export declare function endOfYear(value: DateInput): Date;
/**
 * The first day of the week, in the reader's calendar.
 *
 * Monday in France, Sunday in the United States: asking the platform which day
 * starts the week is exactly the kind of thing a hard-coded value gets wrong.
 */
export declare function startOfWeek(value: DateInput, weekStartsOn?: number): Date;
export declare function isSameDay(a: DateInput, b: DateInput): boolean;
export declare function isToday(value: DateInput): boolean;
export declare function isYesterday(value: DateInput): boolean;
export declare function isTomorrow(value: DateInput): boolean;
export declare function isAfter(a: DateInput, b: DateInput): boolean;
export declare function isBefore(a: DateInput, b: DateInput): boolean;
/** Whole days between two dates, ignoring the time of day. */
export declare function differenceInDays(a: DateInput, b: DateInput): number;
export declare function subDays(value: DateInput, days: number): Date;
export declare function subMonths(value: DateInput, n: number): Date;
export declare function subYears(value: DateInput, n: number): Date;
export declare function endOfMonth(value: DateInput): Date;
export declare function endOfWeek(value: DateInput, weekStartsOn?: number): Date;
export declare function isSameMonth(a: DateInput, b: DateInput): boolean;
/** Every day from `start` to `end` inclusive — what calendars grid over. */
export declare function eachDayOfInterval(start: DateInput, end: DateInput): Date[];
/** `YYYY-MM-DD` in the viewer's own day. */
export declare function toISODate(value: DateInput): string;
/** `YYYY-MM` — month keys. */
export declare function toISOMonth(value: DateInput): string;
/** `HH:MM` on the 24-hour clock, whatever the reader's language prefers. */
export declare function toISOTime(value: DateInput): string;
/** `YYYY-MM-DDTHH:MM` — the value an `<input type="datetime-local">` expects. */
export declare function toISODateTimeLocal(value: DateInput): string;
/**
 * ISO 8601 week number — what `date-fns` wrote as `'I'`.
 *
 * The rule is not "the nth block of seven days": week 1 is the one holding the
 * first Thursday of the year, which is why the calculation moves to that
 * Thursday before counting. Getting this wrong shows up once a year, in the days
 * around New Year, on exactly the screens nobody re-checks.
 */
export declare function isoWeek(value: DateInput): number;
/** The ISO week-numbering year, which differs from the calendar year at the turn. */
export declare function isoWeekYear(value: DateInput): number;
