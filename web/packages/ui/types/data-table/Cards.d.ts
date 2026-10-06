import type { TFunction } from 'i18next';
import type { DataTableColumn, DataTableRowAction } from './types';
export interface CardsProps<T> {
    rows: T[];
    columns: DataTableColumn<T>[];
    rowKey: (row: T) => string;
    selectable: boolean;
    selected: Set<string>;
    onToggle: (id: string) => void;
    rowActions?: DataTableRowAction<T>[];
    onRowClick?: (row: T) => void;
    touch: boolean;
    t?: TFunction;
}
/**
 * Narrow layout — the table becomes a list of cards.
 *
 * This is a different HIERARCHY, not a squeezed table: the primary column
 * becomes the card's title, the remaining columns become label/value pairs, and
 * the row's actions collapse into a single overflow control (a bottom sheet on
 * touch, a menu with a mouse). A horizontally scrolling table on a phone is a
 * table nobody reads.
 */
export declare function DataTableCards<T>({ rows, columns, rowKey, selectable, selected, onToggle, rowActions, onRowClick, touch, t, }: CardsProps<T>): import("react").JSX.Element;
