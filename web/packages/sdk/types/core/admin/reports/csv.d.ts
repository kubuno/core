import type { ReportModel } from './model';
/**
 * The report as a spreadsheet.
 *
 * ## Why this is hand-rolled and not a library
 *
 * CSV has no specification anybody follows; what it has is a set of habits a
 * spreadsheet expects. Three of them decide whether the file opens correctly or
 * as one column of mojibake, and all three are two lines of code:
 *
 *   1. **A byte-order mark.** Excel reads a BOM-less file as the machine's
 *      legacy code page, which turns every accented character into rubbish. The
 *      file below starts with U+FEFF for that single reason — written as an
 *      escape, never as the character itself, which is invisible in source and
 *      is exactly the kind of thing a well-meaning editor strips.
 *   2. **The separator matches the decimal mark.** A locale that writes `12,5`
 *      cannot also use `,` between fields — the shares would split in half, one
 *      column per digit. So the separator is CHOSEN from the locale: `;` where
 *      the decimal mark is a comma, `,` everywhere else. This is why French
 *      spreadsheets expect semicolons, and it is not a preference.
 *   3. **Quoting.** A field containing the separator, a quote or a newline is
 *      wrapped and its quotes doubled. A module display name with a comma in it
 *      is not hypothetical.
 *
 * ## What the file contains
 *
 * The whole document, not just its tables: the instance, the report, the window,
 * who produced it and when, then the figures, then the tables — series,
 * breakdown, and the RECORDS behind them. A CSV detached from its header is a
 * column of numbers nobody can date — which is the failure this entire feature
 * exists to fix, and it would be odd to reintroduce it in the export.
 *
 * The export carries the same truncation notices as the page. A file that
 * stopped at two thousand rows and did not say so is the worst object this
 * feature could produce: it looks exhaustive, it sorts, it sums, and it is
 * wrong.
 */
/** A row of the file: cells, or `null` for a blank separating line. */
export type CsvRow = string[] | null;
/**
 * Rows → the text of a CSV file, BOM included.
 *
 * CRLF line endings: the one habit every spreadsheet on every system agrees on.
 */
export declare function toCsv(rows: CsvRow[], locale: string): string;
/** A number for a spreadsheet CELL: no grouping, the locale's decimal mark. */
export declare function csvNumber(value: number, locale: string, decimals?: number): string;
/** What the header of the file states, before any table. */
export interface CsvHeading {
    instance: string;
    title: string;
    about: string;
    periodLabel: string;
    generatedAt: string;
    generatedBy: string;
}
/** The words the file uses for its own structure, already translated. */
export interface CsvWords {
    instance: string;
    report: string;
    about: string;
    period: string;
    from: string;
    to: string;
    timezone: string;
    generated: string;
    by: string;
    total: string;
    previous: string;
    variation: string;
    series: string;
    bucket: string;
    value: string;
    breakdown: string;
    entry: string;
    share: string;
    quota: string;
    used: string;
    truncated: string;
    none: string;
    /** Heading of the records section. */
    detail: string;
    /** Why there are no records, already spelt. Empty when there are. */
    detailNone: string;
    /** "listed / total", already spelt. Empty when there is no table. */
    detailCount: string;
    /** The ceiling sentence, already spelt. Empty when the list is complete. */
    detailTruncated: string;
}
/**
 * The whole document as rows.
 *
 * Values are written TWICE where the two readings differ: the spelt figure
 * (`1,2 Go`) is what the page shows, and the raw number is what a spreadsheet
 * can sum. A file carrying only the first is a picture of a table; one carrying
 * only the second loses the unit.
 */
export declare function reportRows(model: ReportModel, heading: CsvHeading, words: CsvWords, locale: string): CsvRow[];
/**
 * Hands the file to the browser.
 *
 * An object URL rather than a `data:` one: a `data:` URL of a few hundred
 * kilobytes is refused outright by more than one browser, and a report of a
 * thousand accounts reaches that easily. Revoked on the next frame — kept alive
 * only as long as the click needs it.
 */
export declare function downloadCsv(filename: string, text: string): void;
/** A file name a directory can be sorted by: subject, window, day. */
export declare function csvFilename(panelId: string, periodId: string): string;
