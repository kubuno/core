import type { TableItem } from './types';
/**
 * A table block, whole or in slices.
 *
 * The same component draws the measuring pass (every row, `slice` omitted) and
 * each fragment on a sheet. One renderer for both is not tidiness: a fragment
 * drawn by different code than the one that was measured would be a different
 * height, and the cut would land somewhere other than where the preview showed
 * it.
 *
 * The columns are PINNED (`widths`), for the reason given on that prop: a table
 * whose columns are recomputed per fragment is a different table on every sheet,
 * and the heights the cut was computed from stop being the heights on the page.
 */
export default function TableFragment({ item, slice, widths }: {
    item: TableItem;
    /** Which rows this fragment shows, and whether it is the first/last one. */
    slice?: {
        from: number;
        to: number;
        continued: boolean;
        last: boolean;
    };
    /**
     * Column widths, in pixels, taken once from the whole table.
     *
     * Without them a fragment lays its columns out from the rows it happens to
     * carry: the sheet whose addresses are short gets a narrow address column,
     * its neighbours' rows wrap where the measured ones did not, and the cut
     * lands somewhere other than where it was computed. Pinning the columns
     * makes every fragment the same table — which is also what a reader expects
     * of a table continued overleaf.
     */
    widths?: number[];
}): import("react").JSX.Element;
