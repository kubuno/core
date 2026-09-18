import type { FlowItem, Sheet } from './types';
/**
 * Cutting a document into sheets.
 *
 * A pure function of heights: it never touches the DOM, which is what makes it
 * testable and what makes the preview and the printout agree — both are drawn
 * from the same array of `Sheet`.
 *
 * ## The three rules it enforces
 *
 *  1. **An atom is never cut.** It fits on the remaining space or it opens the
 *     next sheet.
 *  2. **A table is cut between rows, never through one**, its column heading is
 *     repeated on every fragment, and its total row travels with the LAST
 *     fragment — a total restated at the foot of each sheet reads as a subtotal
 *     and is a lie about the figure above it.
 *  3. **No orphan start.** A table that can only fit its heading and one row at
 *     the bottom of a sheet starts on the next one instead: two lines under a
 *     heading, then a page turn, is worse than a little white space.
 */
/**
 * Space between two blocks.
 *
 * ⚠ Coupled to `index.css`: `[data-admin-report] [data-report-card]` sets
 * `margin: 4mm 0 0 0`. The two must agree — the paginator adds this to its
 * running total, the browser adds it to the sheet, and a millimetre of
 * disagreement per block becomes a centimetre by the tenth one.
 */
export declare const GAP: number;
/** What the measuring pass hands over, per item. */
export interface AtomMetrics {
    height: number;
}
export interface TableMetrics {
    /** Title + the block's top padding: repeated on every fragment. */
    chromeTop: number;
    /** The block's bottom padding, without the note. */
    chromeBottom: number;
    head: number;
    rows: number[];
    /** Total row, on the last fragment only. 0 when the table has none. */
    foot: number;
    /** Sentence under the table, on the last fragment only. */
    note: number;
}
export type Metrics = Record<string, AtomMetrics | TableMetrics>;
/** What one sheet offers: how tall it is, and the measurements taken at ITS width. */
export interface SheetSpec {
    height: number;
    metrics: Metrics;
}
/**
 * @param items the document, in reading order
 * @param spec  called with a sheet's index (0-based, excluding any cover), and
 *              returning that sheet's usable height and the measurements taken
 *              at its own content width.
 *
 * The indirection is what makes ORIENTATION PER SHEET possible: sheet 3 can be
 * landscape while its neighbours are portrait, and it is not merely drawn wider
 * — it is filled with the row heights the document actually has at that width,
 * which are not the portrait ones. A single set of measurements would put the
 * portrait cut on a landscape sheet and leave it either short or overflowing.
 */
export declare function paginate(items: FlowItem[], spec: (index: number) => SheetSpec): Sheet[];
