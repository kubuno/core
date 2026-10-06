import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { cn } from './cn'
import {
  itemChildren, itemText, listRows, moveIndex, select, typeAhead, type ListItemDef, type Selection,
} from './listCore'
import { LIST_MAX_HEIGHT, LIST_ROW_HEIGHT } from './ListBox'
import { useVirtualList } from './useVirtualList'

/** A `Column` of a `ListView` (the same element as the `DataTable`'s). */
export interface ListColumnDef {
  id?: string
  key?: string
  header?: React.ReactNode
  /** Reads the cell of a bound row (`Binding`). */
  cell?: (row: unknown) => React.ReactNode
  width?: number | string
  align?: 'left' | 'center' | 'right'
}

export type ListViewView = 'Details' | 'List' | 'LargeIcon'

export interface ListViewProps {
  /** The `Item` and `Column` children, in document order (a column is told by its header, binding, width or alignment). */
  entries?: Array<ListItemDef | ListColumnDef>
  /** `ItemsSource`: the rows; each column shows the field its `Binding` names. */
  rows?: unknown[]
  /** Web: Details (columns), List (one column of texts) or LargeIcon (tiles). */
  view?: ListViewView
  /** The selected row (the anchor of a multiple selection); `-1` = none. Controlled when given. */
  selectedIndex?: number
  onSelectionChange?: (index: number, selected: number[]) => void
  multiSelect?: boolean
  /** Enter or a double click on a row. */
  onItemActivate?: (item: unknown, index: number) => void
  /** Row height in pixels (Details, List); 0 = standard. */
  itemHeight?: number
  height?: number
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

const COLUMN_KEYS = ['header', 'cell', 'width', 'align'] as const

/** Whether an adapted child is a `Column` (the `Item` children carry text, value, icon or sub-items). */
export function isColumn(e: unknown): e is ListColumnDef {
  return !!e && typeof e === 'object' && COLUMN_KEYS.some((k) => k in (e as object))
}

const ALIGN = { left: 'text-start', center: 'text-center', right: 'text-end' } as const
const TILE_W = 104
const TILE_H = 96

/**
 * A list of items in columns (the `.kbview` `ListView`), or as tiles: `role="grid"` in Details with its column
 * headers, `role="listbox"` otherwise; selection of one or several rows (Ctrl / Shift), arrow keys (the four of
 * them on tiles), Home / End, Page Up / Page Down, type-ahead, Enter or a double click activates. Virtualised.
 */
export const ListView = React.forwardRef<HTMLDivElement, ListViewProps>(function ListView(
  { entries, rows: bound, view = 'Details', selectedIndex, onSelectionChange, multiSelect = false, onItemActivate, itemHeight, height, disabled, className, style, ...aria },
  ref,
) {
  const columns = useMemo(() => (entries ?? []).filter(isColumn), [entries])
  const items = useMemo(() => (entries ?? []).filter((e) => !isColumn(e)) as ListItemDef[], [entries])
  const rows = listRows(bound, items)
  const labels = useMemo(() => rows.map(itemText), [rows])
  const id = useId()
  const mode = multiSelect ? 'MultiExtended' : 'One'
  const [sel, setSel] = useState<Selection>(() => ({ selected: new Set(selectedIndex !== undefined && selectedIndex >= 0 ? [selectedIndex] : []), anchor: selectedIndex ?? -1 }))
  const [active, setActive] = useState(selectedIndex ?? -1)
  const [focused, setFocused] = useState(false)
  const typed = useRef({ text: '', at: 0 })
  const host = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  const tiles = view === 'LargeIcon'
  const perRow = tiles ? Math.max(1, Math.floor(Math.max(0, width - 8) / TILE_W)) : 1
  const rowHeight = tiles ? TILE_H : itemHeight && itemHeight > 0 ? itemHeight : LIST_ROW_HEIGHT
  const header = view === 'Details' && columns.length > 0 ? LIST_ROW_HEIGHT : 0
  const lines = Math.ceil(rows.length / perRow)
  const vl = useVirtualList(lines, rowHeight, header)
  const setRoot = useCallback((el: HTMLDivElement | null) => {
    host.current = el
    vl.ref(el)
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }, [vl.ref, ref]) // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = host.current
    if (!el || !tiles) return
    setWidth(el.clientWidth)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [tiles])

  useEffect(() => {
    if (selectedIndex === undefined || (selectedIndex === sel.anchor && (selectedIndex < 0 || sel.selected.has(selectedIndex)))) return
    setSel({ selected: new Set(selectedIndex >= 0 ? [selectedIndex] : []), anchor: selectedIndex })
    if (selectedIndex >= 0) setActive(selectedIndex)
  }, [selectedIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: Selection) => {
    const changed = next.anchor !== sel.anchor || next.selected.size !== sel.selected.size || [...next.selected].some((k) => !sel.selected.has(k))
    if (!changed) return
    setSel(next)
    onSelectionChange?.(next.selected.size ? next.anchor : -1, [...next.selected].sort((a, b) => a - b))
  }
  const focusRow = (index: number) => {
    setActive(index)
    vl.reveal(Math.floor(index / perRow))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const rtl = host.current ? getComputedStyle(host.current).direction === 'rtl' : false
    const to = moveIndex(e.key, active, rows.length, vl.pageRows, perRow, rtl)
    if (to !== null) {
      e.preventDefault()
      focusRow(to)
      if (!(e.ctrlKey || e.metaKey)) commit(select(mode, sel, to, { range: multiSelect && e.shiftKey }))
      return
    }
    if (e.key === ' ') {
      e.preventDefault()
      if (active >= 0) commit(select(mode, sel, active, { toggle: multiSelect && (e.ctrlKey || e.metaKey), range: multiSelect && e.shiftKey }))
      return
    }
    if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault()
        onItemActivate?.(rows[active], active)
      }
      return
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now()
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + e.key, at: now }
      const at = typeAhead(typed.current.text, labels, active)
      if (at >= 0) {
        focusRow(at)
        commit(select(mode, sel, at))
      }
    }
  }

  /** The text of a row's column `c`: a bound row through its column's Binding, an Item by its sub-items. */
  const cellOf = (row: unknown, c: number): React.ReactNode => {
    const col = columns[c]
    if (col?.cell && bound) return col.cell(row) as React.ReactNode
    if (c === 0) return itemText(row)
    const sub = itemChildren(row)
    return sub ? itemText(sub[c - 1]) : ''
  }

  const rowId = (k: number) => `${id}-r${k}`
  const onRowClick = (k: number, e: React.MouseEvent) => {
    if (disabled) return
    setActive(k)
    commit(select(mode, sel, k, { toggle: multiSelect && (e.ctrlKey || e.metaKey), range: multiSelect && e.shiftKey }))
  }
  const rowState = (k: number) => cn(
    sel.selected.has(k) ? 'bg-primary-light text-text-primary' : 'hover:bg-surface-1',
    focused && k === active && 'outline outline-2 -outline-offset-2 outline-primary',
  )
  const common = (k: number) => ({
    id: rowId(k),
    'aria-selected': sel.selected.has(k),
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
    onClick: (e: React.MouseEvent) => onRowClick(k, e),
    onDoubleClick: () => !disabled && onItemActivate?.(rows[k], k),
  })

  const body: React.ReactNode[] = []
  const template = columns.map((c) => (typeof c.width === 'number' ? `${c.width}px` : c.width ?? 'minmax(0, 1fr)')).join(' ') || 'minmax(0, 1fr)'
  for (let line = vl.start; line < vl.end; line++) {
    if (tiles) {
      for (let j = 0; j < perRow; j++) {
        const k = line * perRow + j
        if (k >= rows.length) break
        const it = rows[k] as ListItemDef
        const Icon = rows[k] && typeof rows[k] === 'object' ? it.icon : undefined
        body.push(
          <div
            key={k}
            role="option"
            aria-posinset={k + 1}
            aria-setsize={rows.length}
            {...common(k)}
            className={cn('absolute flex flex-col items-center justify-center gap-1.5 rounded-md px-1 text-center select-none', rowState(k))}
            style={{ top: line * TILE_H, insetInlineStart: 4 + j * TILE_W, width: TILE_W - 8, height: TILE_H - 8 }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-text-secondary">
              {Icon ? <Icon size={22} /> : <span className="text-base">{labels[k].slice(0, 1).toUpperCase()}</span>}
            </span>
            <span className="w-full truncate text-xs">{labels[k]}</span>
          </div>,
        )
      }
      continue
    }
    const k = line
    if (view === 'Details' && columns.length > 0) {
      body.push(
        <div
          key={k}
          role="row"
          aria-rowindex={k + 2}
          {...common(k)}
          className={cn('absolute inset-x-0 grid items-center border-b border-border/60 select-none', rowState(k))}
          style={{ top: k * rowHeight, height: rowHeight, gridTemplateColumns: template }}
        >
          {columns.map((c, j) => (
            <span key={j} role="gridcell" className={cn('min-w-0 truncate px-3', ALIGN[c.align ?? 'left'])}>{cellOf(rows[k], j)}</span>
          ))}
        </div>,
      )
    } else {
      const it = rows[k] as ListItemDef
      const Icon = rows[k] && typeof rows[k] === 'object' ? it.icon : undefined
      body.push(
        <div
          key={k}
          role="option"
          aria-posinset={k + 1}
          aria-setsize={rows.length}
          {...common(k)}
          className={cn('absolute inset-x-0 flex items-center gap-2 px-3 select-none', rowState(k))}
          style={{ top: k * rowHeight, height: rowHeight }}
        >
          {Icon && <Icon size={16} className="shrink-0 text-text-secondary" />}
          <span className="min-w-0 truncate">{labels[k]}</span>
        </div>,
      )
    }
  }
  const grid = view === 'Details' && columns.length > 0
  const box: React.CSSProperties = height ? { height } : { maxHeight: LIST_MAX_HEIGHT }
  return (
    <div
      ref={setRoot}
      role={grid ? 'grid' : 'listbox'}
      tabIndex={disabled ? -1 : 0}
      aria-multiselectable={multiSelect || undefined}
      aria-rowcount={grid ? rows.length + 1 : undefined}
      aria-colcount={grid ? columns.length : undefined}
      aria-activedescendant={focused && active >= 0 && active < rows.length ? rowId(active) : undefined}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      onScroll={vl.onScroll}
      onFocus={() => { setFocused(true); if (active < 0 && rows.length) setActive(sel.anchor >= 0 ? sel.anchor : 0) }}
      onBlur={() => setFocused(false)}
      className={cn(
        'relative overflow-y-auto rounded-md border border-border bg-surface-0 text-sm text-text-primary focus:outline-none',
        focused && 'border-primary',
        disabled && 'opacity-50',
        className,
      )}
      style={{ ...box, ...style }}
      {...aria}
    >
      {grid && (
        <div
          role="row"
          aria-rowindex={1}
          className="sticky top-0 z-[1] grid items-center border-b border-border bg-surface-1 font-medium text-text-secondary"
          style={{ height: header, gridTemplateColumns: template }}
        >
          {columns.map((c, j) => (
            <span key={j} role="columnheader" className={cn('min-w-0 truncate px-3', ALIGN[c.align ?? 'left'])}>{c.header}</span>
          ))}
        </div>
      )}
      <div style={{ position: 'relative', height: lines * rowHeight }}>{body}</div>
    </div>
  )
})

ListView.displayName = 'ListView'
