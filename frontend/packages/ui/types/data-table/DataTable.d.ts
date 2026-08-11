import type { DataTableProps } from './types';
/**
 * DataTable — the one table of the design system.
 *
 * Replaces five hand-written `<table>`s (three paddings, four header skins, no
 * sorting anywhere) and the two divergent paginations — one 0-based and
 * server-side, the other 1-based and client-side. Everything they disagreed on
 * is settled here: the public API is 0-based, the displayed page is 1-based, and
 * the bar always lives in the table's own footer.
 *
 * ── Horizontal overflow ──────────────────────────────────────────────────────
 * The table scrolls INSIDE its own box. The scroller is `overflow-x-auto` and
 * the root is `min-w-0` — without that, a wide table makes its flex/grid parent
 * grow and the whole PAGE scrolls sideways, which the project forbids.
 *
 * ── Layout ───────────────────────────────────────────────────────────────────
 * `layout="auto"` follows the CONTAINER width, not the viewport: under
 * `cardsBelow` (700 px) the rows become cards (see `Cards.tsx`). A table in a
 * narrow side panel is just as unreadable on a desktop as on a phone.
 *
 * ── States ───────────────────────────────────────────────────────────────────
 * loading → skeleton · error → `EmptyState variant="error"` with a retry ·
 * no rows → `first-use` (invites creation) · no rows WITH filters on →
 * `no-results` (offers to clear them, never a creation). Pass `filtered` for
 * that distinction to be made correctly.
 */
export declare function DataTable<T>({ rows, columns, rowKey, loading, skeletonRows, error, onRetry, filtered, onClearFilters, emptyState, noResultsState, defaultSort, sort: sortProp, onSortChange, manualSort, pageSize: pageSizeProp, pageSizeOptions, onPageSizeChange, page: pageProp, onPageChange, totalRows, manualPagination, selectable, selectedIds, onSelectionChange, bulkActions, rowActions, onRowClick, configurableColumns, hiddenColumns, onHiddenColumnsChange, resizableColumns, title, toolbar, layout, cardsBelow, minTableWidth, className, t, }: DataTableProps<T>): import("react").JSX.Element;
