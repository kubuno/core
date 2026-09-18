import type { ReactNode } from 'react';
import type { ReportModel } from './model';
import type { FlowItem } from './paged/types';
/**
 * The figures, as tables.
 *
 * ## Why the tables are the point
 *
 * A chart says a shape; a report is handed to somebody who was not in the room
 * and has to answer questions the shape does not. So every bucket gets a row and
 * every slice gets a row — including the ones a card folds away, because "top
 * six" is a drawing decision and a report that inherited it would quietly omit
 * the seventh account without ever saying so.
 *
 * ## Printing
 *
 * `<thead>` repeats on every sheet (`display: table-header-group`, set in the
 * print stylesheet) and no row is allowed to break across a page. Both are in
 * `index.css` rather than here: they apply to every table inside a report, and a
 * rule attached to the document rather than to one component cannot be forgotten
 * by the next table somebody adds.
 */
/**
 * A section of the document — a card on screen, a block on paper.
 *
 * `table` is not decoration: it tells the print stylesheet that this block MAY
 * be split across sheets. Blocks are otherwise kept whole (`break-inside:
 * avoid`), which is right for a heading over three figures and wrong for a
 * table of two thousand rows — a block taller than a page cannot be kept whole,
 * and asking for it only makes the engine start it on a fresh sheet, leaving
 * the previous one half empty. A table that may split is also the only kind
 * whose repeated `<thead>` means anything.
 */
export declare function ReportBlock({ title, children, note, table, }: {
    title: string;
    children: ReactNode;
    note?: ReactNode;
    /** This block contains a table that is allowed to run over several sheets. */
    table?: boolean;
}): import("react").JSX.Element;
/**
 * A sentence where a table would have been, when there is nothing to tabulate.
 *
 * Exported so the detail section (`ReportDetail.tsx`) states its own absences in
 * exactly the same voice: "there is nothing here" has to look the same wherever
 * it is said, or a reader starts wondering whether it means two different
 * things.
 */
export declare function Nothing({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
/**
 * The cell and heading classes of every table in the document.
 *
 * Exported rather than repeated: three tables that drifted apart on padding
 * would print as three tables from three documents. The print stylesheet
 * overrides borders and padding anyway (`index.css`), which is exactly why the
 * screen side has to be stated once.
 */
export declare const CELL = "border-b border-border px-3 py-1.5 align-top";
export declare const HEAD = "border-b border-border px-3 py-1.5 align-top bg-surface-1 text-left font-medium text-text-secondary";
/**
 * The series, as a paginable item.
 *
 * A hook rather than a component: the paginator needs the ROWS, one node each,
 * so it can decide which of them land on which sheet. A component would hand it
 * one opaque `<table>` and the cut would go back to being the engine's guess.
 */
export declare function useSeriesItem(model: ReportModel): FlowItem;
/** Every slice of the breakdown — the whole of it, not the head of it. */
export declare function useBreakdownItem(model: ReportModel, tones: (key: string, i: number) => string): FlowItem;
