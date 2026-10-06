import { type RefObject } from 'react';
import type { DataTableColumn, DataTableSort } from './types';
/**
 * Container-width watcher. The table's layout must follow the box it was GIVEN,
 * not the viewport: the same table renders in a full-width admin page, in a
 * 320 px side panel and in the theme preview's 390 px device stage — on the
 * very same desktop window. `useIsMobile()` answers "is this a phone", which is
 * a different question, and is used only to choose between a bottom sheet and a
 * dropdown for the overflow actions.
 *
 * Returns `null` until the first measurement. That distinction matters: a
 * container that genuinely measures 0 (collapsed panel, clipped accordion) is
 * NOT "unmeasured", and must not be treated as wide — doing so renders a
 * 640 px-min table inside a zero-width box, which then pushes a horizontal
 * scrollbar onto the page. Measuring in a layout effect means the very first
 * paint already has the real width, so there is no cards→table flash either.
 */
export declare function useContainerWidth(ref: RefObject<HTMLElement | null>): number | null;
/** Plain-text name of a column, for the chooser, card labels and aria-labels. */
export declare function columnLabel<T>(col: DataTableColumn<T>): string;
/** Sort a copy of `rows`; blanks sink, and the original order breaks ties. */
export declare function sortRows<T>(rows: T[], columns: DataTableColumn<T>[], sort: DataTableSort | null): T[];
/** Next state of a sort toggle: asc → desc → none → asc. */
export declare function nextSort(current: DataTableSort | null, columnId: string): DataTableSort | null;
