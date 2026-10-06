import type { ReportModel } from './model';
import type { FlowItem } from './paged/types';
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
