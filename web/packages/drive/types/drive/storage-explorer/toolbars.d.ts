import type { SortField, TFunc } from './types';
export declare function MobileControlBar({ sortField, sortDir, onSortField, onSortDir, grid, onGrid, t }: {
    sortField: SortField;
    sortDir: 'asc' | 'desc';
    onSortField: (f: SortField) => void;
    onSortDir: (d: 'asc' | 'desc') => void;
    grid: boolean;
    onGrid: (v: boolean) => void;
    t: TFunc;
}): import("react").JSX.Element;
export declare function SortFilterBarBase({ sortField, sortDir, typeFilter, onSortField, onSortDir, onTypeFilter, hideType }: {
    sortField: SortField;
    sortDir: 'asc' | 'desc';
    typeFilter: string | null;
    onSortField: (v: SortField) => void;
    onSortDir: (v: 'asc' | 'desc') => void;
    onTypeFilter: (v: string | null) => void;
    hideType?: boolean;
}): import("react").JSX.Element;
