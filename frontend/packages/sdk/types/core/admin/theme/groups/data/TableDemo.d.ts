/**
 * The DataTable exercised on real-ish data: sorting, pagination, multi-select
 * with bulk actions, a column chooser, and the loading/error/empty states.
 *
 * The search field is the CALLER's (a table does not own its filters); it is
 * wired to `filtered` so the table picks the "no result" empty state — with a
 * "clear the filters" way out — instead of the "nothing yet" one.
 */
export default function TableDemo(): import("react").JSX.Element;
