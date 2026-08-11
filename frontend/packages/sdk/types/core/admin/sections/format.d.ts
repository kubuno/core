/**
 * Formatting helpers shared by the admin sections.
 *
 * They used to be copy-pasted per panel (three different byte formatters, two
 * different timestamp renderings). One implementation means a quota reads the
 * same in the user list, the user sheet and the dashboard.
 */
/** Human-readable size. Below 1 GiB the megabyte is the useful unit. */
export declare function formatBytes(bytes: number): string;
/**
 * Compact ABSOLUTE timestamp. A log is read by date, never by "3 hours ago":
 * the operator correlates it with an incident whose time they already know.
 */
export declare function formatWhen(iso: string, locale: string): string;
/** Date without the clock — for lifecycle fields (creation, last sign-in). */
export declare function formatDay(iso: string, locale: string): string;
/**
 * How long something took, from milliseconds.
 *
 * Deliberately unit-suffixed rather than localised through `Intl`: the value is
 * an engineering measurement read next to a byte count, and "1 minute et
 * 4 secondes" in a table column is noise where "1 min 4 s" is a number.
 */
export declare function formatDuration(ms: number): string;
/** "3 days ago" — only ever a COMPLEMENT to an absolute date, never a replacement. */
export declare function formatAgo(iso: string): string;
