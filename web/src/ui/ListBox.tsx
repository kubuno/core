import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'

import { cn } from './cn'
import {
  itemFlag, itemText, itemValue, listRows, moveIndex, select, typeAhead,
  type ListItemDef, type Selection, type SelectionMode,
} from './listCore'
import { useVirtualList } from './useVirtualList'

export type { ListItemDef, SelectionMode } from './listCore'

/** The standard row height of the list controls, in pixels (`ItemHeight` 0). */
export const LIST_ROW_HEIGHT = 32
/** The height a list without a `Height` grows to before it scrolls. */
export const LIST_MAX_HEIGHT = 320

export interface ListBoxProps {
  /** The `Item` children. */
  items?: ListItemDef[]
  /** `ItemsSource`: rows to show instead of the items (their `Text` / `text` / `label`). */
  source?: unknown[]
  selectionMode?: SelectionMode
  /** The selected item (the anchor of a multiple selection); `-1` = none. Controlled when given. */
  selectedIndex?: number
  /** Called with the new `selectedIndex` and every selected index. */
  onSelectionChange?: (index: number, selected: number[]) => void
  /** Web: the selected item's value (`ValueMember`, else its text). Controlled when given. */
  selectedValue?: string
  onSelectedValueChange?: (value: string) => void
  /** Enter or a double click on an item. */
  onItemActivate?: (item: unknown, index: number) => void
  /** Row height in pixels; 0 = standard. */
  itemHeight?: number
  /** Height of the list in pixels; unset = the rows' height up to 320 px, then it scrolls. */
  height?: number
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

/** What `CheckedListBox` adds to the list (internal). */
interface Checks {
  checked: ReadonlySet<number>
  toggle: (index: number) => void
  checkOnClick: boolean
}

/**
 * The list body shared by `ListBox` and `CheckedListBox`: `role="listbox"` holding the focus itself and pointing
 * at the current option with `aria-activedescendant`, virtualised (only the rows in view are in the DOM, each
 * with `aria-posinset` / `aria-setsize`), keyboard of the WAI-ARIA listbox pattern.
 */
export function ListBase({
  items, source, selectionMode = 'One', selectedIndex, onSelectionChange, selectedValue, onSelectedValueChange,
  onItemActivate, itemHeight, height, disabled, className, style, checks, rootRef, ...aria
}: ListBoxProps & { checks?: Checks; rootRef?: React.Ref<HTMLDivElement> }): React.ReactElement {
  const rows = listRows(source, items)
  const labels = useMemo(() => rows.map(itemText), [rows])
  const rowHeight = itemHeight && itemHeight > 0 ? itemHeight : LIST_ROW_HEIGHT
  const id = useId()
  const valueIndex = selectedValue !== undefined ? rows.findIndex((r) => itemValue(r) === selectedValue) : undefined
  const controlled = selectedIndex !== undefined ? selectedIndex : valueIndex
  const [sel, setSel] = useState<Selection>(() => ({ selected: new Set(controlled !== undefined && controlled >= 0 ? [controlled] : []), anchor: controlled ?? -1 }))
  const [active, setActive] = useState(controlled !== undefined && controlled >= 0 ? controlled : -1)
  const [focused, setFocused] = useState(false)
  const typed = useRef({ text: '', at: 0 })
  const vl = useVirtualList(rows.length, rowHeight)
  const setRoot = useCallback((el: HTMLDivElement | null) => {
    vl.ref(el)
    if (typeof rootRef === 'function') rootRef(el)
    else if (rootRef) (rootRef as { current: HTMLDivElement | null }).current = el
  }, [vl.ref, rootRef]) // eslint-disable-line react-hooks/exhaustive-deps

  // A new controlled selection (a binding, the code) replaces the user's.
  useEffect(() => {
    if (controlled === undefined || controlled === sel.anchor && (controlled < 0 || sel.selected.has(controlled))) return
    setSel({ selected: new Set(controlled >= 0 ? [controlled] : []), anchor: controlled })
    if (controlled >= 0) setActive(controlled)
  }, [controlled]) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: Selection) => {
    const changed = next.anchor !== sel.anchor || next.selected.size !== sel.selected.size || [...next.selected].some((k) => !sel.selected.has(k))
    if (!changed) return
    setSel(next)
    onSelectionChange?.(next.selected.size ? next.anchor : -1, [...next.selected].sort((a, b) => a - b))
    if (onSelectedValueChange && next.anchor >= 0) onSelectedValueChange(itemValue(rows[next.anchor]))
  }
  const focusRow = (index: number) => {
    setActive(index)
    vl.reveal(index)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const multi = selectionMode === 'MultiSimple' || selectionMode === 'MultiExtended'
    const to = moveIndex(e.key, active, rows.length, vl.pageRows)
    if (to !== null) {
      e.preventDefault()
      focusRow(to)
      if (selectionMode === 'One') commit(select('One', sel, to))
      else if (selectionMode === 'MultiExtended' && !(e.ctrlKey || e.metaKey)) commit(select('MultiExtended', sel, to, { range: e.shiftKey }))
      return
    }
    if (e.key === ' ') {
      e.preventDefault()
      if (active < 0) return
      if (checks) {
        checks.toggle(active)
        if (selectionMode !== 'None' && !multi) commit(select('One', sel, active))
        return
      }
      commit(select(selectionMode, sel, active, { toggle: selectionMode === 'MultiExtended' && (e.ctrlKey || e.metaKey || !e.shiftKey), range: e.shiftKey }))
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
      const to2 = typeAhead(typed.current.text, labels, active)
      if (to2 >= 0) {
        focusRow(to2)
        if (selectionMode === 'One' || selectionMode === 'MultiExtended') commit(select('One', sel, to2))
      }
    }
  }

  const onRowClick = (index: number, e: React.MouseEvent) => {
    if (disabled) return
    setActive(index)
    const onBox = (e.target as Element).closest?.('[data-kb-check]')
    if (checks && (checks.checkOnClick || onBox || sel.selected.has(index))) checks.toggle(index)
    commit(select(selectionMode, sel, index, { toggle: e.ctrlKey || e.metaKey, range: e.shiftKey }))
  }

  const total = rows.length * rowHeight
  const box: React.CSSProperties = height ? { height } : { maxHeight: LIST_MAX_HEIGHT }
  const optionId = (k: number) => `${id}-o${k}`
  const options: React.ReactNode[] = []
  for (let k = vl.start; k < vl.end; k++) {
    const row = rows[k]
    const it = row as ListItemDef
    const Icon = row && typeof row === 'object' ? it.icon : undefined
    const isSel = sel.selected.has(k)
    const isChecked = checks?.checked.has(k) ?? false
    options.push(
      <div
        key={k}
        id={optionId(k)}
        role="option"
        aria-selected={selectionMode === 'None' ? undefined : isSel}
        aria-checked={checks ? isChecked : undefined}
        aria-posinset={k + 1}
        aria-setsize={rows.length}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => onRowClick(k, e)}
        onDoubleClick={() => !disabled && onItemActivate?.(row, k)}
        className={cn(
          'absolute inset-x-0 flex items-center gap-2 px-3 select-none',
          isSel ? 'bg-primary-light text-text-primary' : 'hover:bg-surface-1',
          focused && k === active && 'outline outline-2 -outline-offset-2 outline-primary',
        )}
        style={{ top: k * rowHeight, height: rowHeight }}
      >
        {checks && (
          <span
            data-kb-check=""
            aria-hidden
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border',
              isChecked ? 'border-primary bg-primary text-white' : 'border-border-strong bg-surface-0',
            )}
          >
            {isChecked && <Check size={12} strokeWidth={3} />}
          </span>
        )}
        {Icon && <Icon size={16} className="shrink-0 text-text-secondary" />}
        <span className="min-w-0 truncate">{labels[k]}</span>
      </div>,
    )
  }
  return (
    <div
      ref={setRoot}
      role="listbox"
      tabIndex={disabled ? -1 : 0}
      aria-multiselectable={selectionMode === 'MultiSimple' || selectionMode === 'MultiExtended' || undefined}
      aria-activedescendant={active >= 0 && active < rows.length && focused ? optionId(active) : undefined}
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
      <div style={{ position: 'relative', height: total }}>{options}</div>
    </div>
  )
}

/**
 * A list of items to choose from (the `.kbview` `ListBox`): one item, several by plain clicks (`MultiSimple`), or
 * several with Ctrl / Shift (`MultiExtended`); arrow keys, Home / End, Page Up / Page Down and type-ahead.
 * Virtualised: ten thousand rows cost what a screenful does.
 */
export const ListBox = React.forwardRef<HTMLDivElement, ListBoxProps>(function ListBox(props, ref) {
  return <ListBase {...props} rootRef={ref} />
})
ListBox.displayName = 'ListBox'

export interface CheckedListBoxProps extends Omit<ListBoxProps, 'selectionMode' | 'selectedValue' | 'onSelectedValueChange'> {
  /** A click anywhere on an item checks it (else the first click selects, the next one checks). */
  checkOnClick?: boolean
  /** Called when an item is checked or unchecked. */
  onItemCheck?: (index: number, checked: boolean) => void
  /** Controlled: the checked indexes. Unset: each item's own `checked` at first, then the user's clicks. */
  checkedIndices?: number[]
}

/**
 * A list whose items carry a check box (the `.kbview` `CheckedListBox`): Space or a click on the box checks an
 * item, `aria-checked` says so; one item at a time is selected.
 */
export const CheckedListBox = React.forwardRef<HTMLDivElement, CheckedListBoxProps>(function CheckedListBox(
  { checkOnClick = false, onItemCheck, checkedIndices, ...props },
  ref,
) {
  const rows = listRows(props.source, props.items)
  const initial = () => new Set(rows.map((r, k) => (itemFlag(r, 'checked') ? k : -1)).filter((k) => k >= 0))
  const [own, setOwn] = useState<Set<number>>(initial)
  // New rows, or check marks changed by a binding or the code: the items' own marks again.
  const marks = rows.map((r) => (itemFlag(r, 'checked') ? 1 : 0)).join('')
  useEffect(() => { if (!checkedIndices) setOwn(initial()) }, [marks, props.source]) // eslint-disable-line react-hooks/exhaustive-deps
  const checked = checkedIndices ? new Set(checkedIndices) : own
  const toggle = (k: number) => {
    const now = !checked.has(k)
    if (!checkedIndices) {
      const next = new Set(own)
      if (now) next.add(k)
      else next.delete(k)
      setOwn(next)
    }
    onItemCheck?.(k, now)
  }
  return <ListBase {...props} selectionMode="One" checks={{ checked, toggle, checkOnClick }} rootRef={ref} />
})
CheckedListBox.displayName = 'CheckedListBox'
