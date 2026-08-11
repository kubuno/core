/**
 * Details view (table) header: sortable columns (Name / Modified / Type / Size /
 * Created) whose date/type/size widths are resizable by dragging the separators;
 * the name column takes the remaining space.
 */
import React from 'react';
import { type DetailsSettings, type DetailsSortField } from './detailsModel';
export declare function DetailsHeader({ details, onDetails, sortField, sortDir, onSortField, onSortDir, onHeaderMenu }: {
    details: DetailsSettings;
    onDetails: (updater: (s: DetailsSettings) => DetailsSettings) => void;
    sortField: DetailsSortField;
    sortDir: 'asc' | 'desc';
    onSortField: (f: DetailsSortField) => void;
    onSortDir: (d: 'asc' | 'desc') => void;
    onHeaderMenu: (e: React.MouseEvent) => void;
}): React.JSX.Element;
