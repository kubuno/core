import type { PanelDef, PanelPeriod } from '../panels/types';
import type { ReportPanel } from './api';
/**
 * The report, as a described document — before anything is drawn.
 *
 * ## Why the model exists at all
 *
 * A report is rendered TWICE: once as a page (which is also what gets printed)
 * and once as a CSV file. Those two renderings must carry the same rows, the
 * same totals and the same labels, or an operator who exports what they printed
 * ends up with a spreadsheet that disagrees with the paper on their desk. Built
 * separately they would drift on the first detail — a share rounded here and
 * truncated there, a bucket named one way in a cell and another in a column.
 *
 * So the figures are assembled once, here, and the two renderers only decide how
 * to paint what this module already decided.
 *
 * ## What it refuses to compute
 *
 * A share of a total that is zero, a percentage against a previous window that
 * counted nothing, a variation for a panel whose past nobody recorded. Each of
 * those comes back `null` and the renderers print a sentence instead of a
 * number — the same rule the cards obey, for the same reason: "+100 %" and
 * "0 %" are both false readings of "there was nothing to compare against", and
 * on a printed page nobody is left to ask.
 */
/** One row of the chronological table. */
export interface SeriesRow {
    /** The instant, spelt in full — a report is read away from its window. */
    label: string;
    /** The same instant, as short as the axis needs it. */
    axis: string;
    value: number;
    /** The value, spelt in the panel's unit. */
    text: string;
}
/** One row of the breakdown table. */
export interface BreakdownRow {
    key: string;
    label: string;
    value: number;
    text: string;
    /** Share of the breakdown's own total, in percent. `null` when it is zero. */
    share: number | null;
    /** This entry's own ceiling, when it has one (an account's quota). */
    capacity: number | null;
    /** Share of THAT ceiling, in percent. `null` without one. */
    used: number | null;
}
/**
 * The records behind the figure, ready to print.
 *
 * Cells are already spelt: an instant is formatted in the zone the document
 * names (never the reader's), everything else is printed exactly as the server
 * stored it. `null` survives as `null` — the page prints an em dash for it and
 * the CSV leaves the cell empty, which are two correct renderings of the same
 * "this record does not carry that".
 */
export interface DetailModel {
    /** Column headings, translated. */
    headers: string[];
    /** `kind` of each column, parallel to `headers`; drives alignment only. */
    kinds: string[];
    rows: (string | null)[][];
    /** The reading stopped at the server's ceiling rather than the window's end. */
    truncated: boolean;
    /** That ceiling, so the page can name it. */
    limit: number;
}
export interface ReportModel {
    /** Formats a figure in the panel's unit — counts, or bytes. */
    fmt: (v: number) => string;
    bytes: boolean;
    total: number;
    totalText: string;
    /** The window of identical length before this one. `null` for a snapshot. */
    previous: number | null;
    previousText: string | null;
    /** Variation in percent. `null` when there is nothing honest to state. */
    delta: number | null;
    /** The panel describes the present, and nothing recorded its past. */
    snapshot: boolean;
    series: SeriesRow[];
    /** Sum of the series — stated only when it can be added up (see below). */
    seriesTotal: number | null;
    breakdown: BreakdownRow[];
    breakdownTotal: number;
    /** The breakdown stopped at the server's ceiling rather than at its end. */
    truncated: boolean;
    /** The records behind the figure. `null` when the source has none to give. */
    detail: DetailModel | null;
    /**
     * Why there are none, as the server's own reason — `snapshot`, `distinct`,
     * `aggregated`, `breakdown`, `withheld`. `null` when the panel HAS records,
     * or when the server never said anything about them.
     */
    detailAbsent: string | null;
    /** The window, spelt for a human: the two dates, and the zone they are in. */
    from: string;
    to: string;
    timezone: string;
    /** The comparison window, same spelling. */
    previousFrom: string;
    previousTo: string;
}
export declare function formatInstant(iso: string, locale: string, timeZone?: string): string;
/**
 * The instant of ONE RECORD, in a table of them.
 *
 * Short date and seconds, where the window bounds get a long date and no
 * seconds — because the two answer different questions. A header states a
 * stretch of time somebody has to be able to check; a detail row states when
 * one event happened, next to two thousand others, and a burst of failed
 * sign-ins inside the same minute is exactly what the reader is looking for.
 * Same zone as everything else on the page: the one the document names.
 */
export declare function formatStamp(iso: string, locale: string, timeZone?: string): string;
export declare function detailColumnKey(id: string): string;
/**
 * Assembles the document.
 *
 * `def` says what the panel is called and how its keys are spelt; `panel` is
 * what the server counted; `period` is the window both were read over.
 * `labelSlice` overrides the wording of one breakdown key when the name is a
 * fact this build has to look up rather than a translation — a module's display
 * name, say. It is the same hook the cards take, so a legend printed on paper
 * and the legend on screen cannot end up naming things differently.
 */
export declare function useReportModel(def: PanelDef, panel: ReportPanel, period: PanelPeriod, labelSlice?: (key: string) => string): ReportModel;
