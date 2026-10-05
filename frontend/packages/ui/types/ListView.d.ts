import React from 'react';
import { type ListItemDef } from './listCore';
/** A `Column` of a `ListView` (the same element as the `DataTable`'s). */
export interface ListColumnDef {
    id?: string;
    key?: string;
    header?: React.ReactNode;
    /** Reads the cell of a bound row (`Binding`). */
    cell?: (row: unknown) => React.ReactNode;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
}
export type ListViewView = 'Details' | 'List' | 'LargeIcon';
export interface ListViewProps {
    /** The `Item` and `Column` children, in document order (a column is told by its header, binding, width or alignment). */
    entries?: Array<ListItemDef | ListColumnDef>;
    /** `ItemsSource`: the rows; each column shows the field its `Binding` names. */
    rows?: unknown[];
    /** Web: Details (columns), List (one column of texts) or LargeIcon (tiles). */
    view?: ListViewView;
    /** The selected row (the anchor of a multiple selection); `-1` = none. Controlled when given. */
    selectedIndex?: number;
    onSelectionChange?: (index: number, selected: number[]) => void;
    multiSelect?: boolean;
    /** Enter or a double click on a row. */
    onItemActivate?: (item: unknown, index: number) => void;
    /** Row height in pixels (Details, List); 0 = standard. */
    itemHeight?: number;
    height?: number;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}
/** Whether an adapted child is a `Column` (the `Item` children carry text, value, icon or sub-items). */
export declare function isColumn(e: unknown): e is ListColumnDef;
/**
 * A list of items in columns (the `.kbview` `ListView`), or as tiles: `role="grid"` in Details with its column
 * headers, `role="listbox"` otherwise; selection of one or several rows (Ctrl / Shift), arrow keys (the four of
 * them on tiles), Home / End, Page Up / Page Down, type-ahead, Enter or a double click activates. Virtualised.
 */
export declare const ListView: React.ForwardRefExoticComponent<ListViewProps & React.RefAttributes<HTMLDivElement>>;
