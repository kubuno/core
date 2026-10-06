import { type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import type { DataTableBulkAction, DataTableColumn } from './types';
export interface ToolbarProps<T> {
    title?: ReactNode;
    toolbar?: ReactNode;
    columns: DataTableColumn<T>[];
    hidden: string[];
    onHiddenChange: (ids: string[]) => void;
    configurableColumns: boolean;
    selectedRows: T[];
    bulkActions?: DataTableBulkAction<T>[];
    onClearSelection: () => void;
    /** Narrow container → the bar must stay ONE row. */
    compact: boolean;
    /** Real touch device → overflow opens a bottom sheet instead of a menu. */
    touch: boolean;
    t?: TFunction;
}
/**
 * The table's top band. It has two mutually exclusive faces:
 *
 *  • idle       — title, the caller's filters, and the column chooser;
 *  • selection  — "N selected", the bulk actions, and a way out.
 *
 * They swap rather than coexist: stacking a selection bar under a filter bar is
 * exactly how a toolbar ends up wrapping onto three rows on a narrow screen.
 * When the container is narrow only ONE bulk action stays inline and the rest
 * move to an overflow — a bottom sheet on touch, a menu with a mouse.
 */
export declare function DataTableToolbar<T>({ title, toolbar, columns, hidden, onHiddenChange, configurableColumns, selectedRows, bulkActions, onClearSelection, compact, touch, t, }: ToolbarProps<T>): import("react").JSX.Element | null;
