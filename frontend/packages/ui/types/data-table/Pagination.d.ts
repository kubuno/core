import type { TFunction } from 'i18next';
export interface PaginationProps {
    /** 0-based. The two hand-rolled admin paginations disagreed on this (one was
     *  0-based, the other 1-based); the component settles it — 0-based in the API,
     *  1-based in what the user reads. */
    page: number;
    pageCount: number;
    total: number;
    pageSize: number;
    pageSizeOptions?: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    /** Narrow container: drop the size selector and the first/last jumps. */
    compact?: boolean;
    t?: TFunction;
}
/** The single pagination bar — always inside the table's own footer band. */
export declare function Pagination({ page, pageCount, total, pageSize, pageSizeOptions, onPageChange, onPageSizeChange, compact, t, }: PaginationProps): import("react").JSX.Element;
