/**
 * Public facade of the data table.
 *
 * The implementation lives in `./data-table/` (toolbar and bulk bar, pagination,
 * card layout for narrow containers, skeleton, sort helpers); this file is the
 * single import path and the exact exported surface for `@kubuno/ui`.
 */
export { DataTable } from './data-table/DataTable'
export { DataTableSkeleton } from './data-table/Skeleton'
export { Pagination } from './data-table/Pagination'
export type { PaginationProps } from './data-table/Pagination'
export type {
  DataTableProps, DataTableColumn, DataTableSort, DataTableBulkAction,
  DataTableRowAction, SortDirection, SortableValue,
} from './data-table/types'
