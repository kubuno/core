/**
 * The shared model of the `@ui` list controls (`ListBox`, `CheckedListBox`, `ListView`, `TreeView`): items, the
 * keyboard moves, type-ahead, selection modes, the visible window of a virtualised list and the flattening of
 * a tree. Pure functions (no React, no DOM): the components call them, the unit tests check them.
 */
import type { ComponentType } from 'react'

/** One item of a list (an `Item` element, or a row of `ItemsSource`). */
export interface ListItemDef {
  /** The text shown. A bound row may carry it as `Text`, `text` or `label`. */
  text?: string
  /** The value (`SelectedValue`); the text when absent. */
  value?: string
  /** An icon before the text (a Lucide component). */
  icon?: ComponentType<{ size?: number; className?: string }>
  /** Checked (`CheckedListBox`): the initial state. */
  checked?: boolean
  /** Expanded (`TreeView`): the initial state. */
  expanded?: boolean
  /** Child items: a sub-tree (`TreeView`), or the next columns' cells (`ListView`). */
  items?: ListItemDef[]
  /** A stable key (the item's `x:Name`, or its position). */
  key?: string
  disabled?: boolean
}

type Row = Record<string, unknown>

/** The text of an item or of a bound row (`Text` / `text` / `label` / `Label` / `Name`, or the value itself). */
export function itemText(it: unknown): string {
  if (it === null || it === undefined) return ''
  if (typeof it !== 'object') return String(it)
  const r = it as Row
  for (const k of ['text', 'Text', 'label', 'Label', 'name', 'Name']) {
    const v = r[k]
    if (v !== undefined && v !== null && typeof v !== 'object') return String(v)
  }
  return ''
}

/** The value of an item or of a bound row (`value` / `Value`, else its text). */
export function itemValue(it: unknown): string {
  if (it && typeof it === 'object') {
    const r = it as Row
    const v = r.value ?? r.Value
    if (v !== undefined && v !== null) return String(v)
  }
  return itemText(it)
}

/** A bound row's or an item's children (`items` / `Items` / `children` / `Children`). */
export function itemChildren(it: unknown): readonly unknown[] | undefined {
  if (!it || typeof it !== 'object') return undefined
  const r = it as Row
  const c = r.items ?? r.Items ?? r.children ?? r.Children
  return Array.isArray(c) ? c : undefined
}

/** A boolean field of an item or row, in either case (`checked` / `Checked`). */
export function itemFlag(it: unknown, name: string): boolean | undefined {
  if (!it || typeof it !== 'object') return undefined
  const r = it as Row
  const v = r[name] ?? r[name.charAt(0).toUpperCase() + name.slice(1)]
  return typeof v === 'boolean' ? v : undefined
}

/** The rows a list shows: the bound `ItemsSource` when it is a list, else the `Item` children. */
export function listRows(source: unknown, items: readonly unknown[] | undefined): readonly unknown[] {
  return Array.isArray(source) ? source : items ?? []
}

// ── Keyboard moves ──

/** Where the focus goes for a navigation key (`null`: not a navigation key). `columns` > 1 for a grid of tiles. */
export function moveIndex(key: string, from: number, count: number, page: number, columns = 1, rtl = false): number | null {
  if (count <= 0) return null
  const last = count - 1
  const at = from < 0 ? -1 : Math.min(from, last)
  const clamp = (v: number) => Math.max(0, Math.min(last, v))
  switch (key) {
    case 'ArrowDown': return at < 0 ? 0 : clamp(at + columns)
    case 'ArrowUp': return at < 0 ? 0 : clamp(at - columns)
    case 'ArrowRight': return columns > 1 ? (at < 0 ? 0 : clamp(at + (rtl ? -1 : 1))) : null
    case 'ArrowLeft': return columns > 1 ? (at < 0 ? 0 : clamp(at + (rtl ? 1 : -1))) : null
    case 'Home': return 0
    case 'End': return last
    case 'PageDown': return at < 0 ? 0 : clamp(at + Math.max(1, page) * columns)
    case 'PageUp': return at < 0 ? 0 : clamp(at - Math.max(1, page) * columns)
    default: return null
  }
}

/** Type-ahead: the next item, after `from`, whose text starts with `prefix` (case and accents ignored). */
export function typeAhead(prefix: string, labels: readonly string[], from: number): number {
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const p = fold(prefix)
  if (!p || labels.length === 0) return -1
  // A repeated single letter cycles through the items starting with it.
  const same = p.length > 1 && [...p].every((c) => c === p[0])
  const want = same ? p[0] : p
  const start = same || p.length === 1 ? from + 1 : Math.max(0, from)
  for (let k = 0; k < labels.length; k++) {
    const i = (start + k) % labels.length
    if (fold(labels[i]).startsWith(want)) return i
  }
  return -1
}

// ── Selection ──

/** `SelectionMode` (WinForms names): none, one item, several by plain clicks, several with Ctrl / Shift. */
export type SelectionMode = 'None' | 'One' | 'MultiSimple' | 'MultiExtended'

export interface Selection {
  /** The selected indexes. */
  readonly selected: ReadonlySet<number>
  /** Where a Shift range starts. */
  readonly anchor: number
}

/**
 * The selection after choosing `index` with a click or a key: `toggle` is Ctrl (or Space in a multi list),
 * `range` is Shift. `MultiSimple` toggles on every choice; `MultiExtended` replaces unless Ctrl / Shift.
 */
export function select(mode: SelectionMode, prev: Selection, index: number, mods: { toggle?: boolean; range?: boolean } = {}): Selection {
  if (mode === 'None' || index < 0) return prev
  if (mode === 'One') return { selected: new Set([index]), anchor: index }
  if (mode === 'MultiSimple') {
    const next = new Set(prev.selected)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    return { selected: next, anchor: index }
  }
  if (mods.range && prev.anchor >= 0) {
    const [a, b] = prev.anchor < index ? [prev.anchor, index] : [index, prev.anchor]
    const next = mods.toggle ? new Set(prev.selected) : new Set<number>()
    for (let k = a; k <= b; k++) next.add(k)
    return { selected: next, anchor: prev.anchor }
  }
  if (mods.toggle) {
    const next = new Set(prev.selected)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    return { selected: next, anchor: index }
  }
  return { selected: new Set([index]), anchor: index }
}

// ── Virtualisation ──

/** The rows to render: those in the viewport plus `overscan` on each side (`end` exclusive). */
export function visibleRange(scrollTop: number, viewport: number, rowHeight: number, count: number, overscan = 6): { start: number; end: number } {
  if (count <= 0 || rowHeight <= 0) return { start: 0, end: 0 }
  // Before the first measure: a screenful (the viewport is unknown).
  const height = viewport > 0 ? viewport : rowHeight * 20
  const first = Math.floor(Math.max(0, scrollTop) / rowHeight)
  const last = Math.ceil((Math.max(0, scrollTop) + height) / rowHeight)
  return { start: Math.max(0, first - overscan), end: Math.min(count, last + overscan) }
}

/** The scroll position that shows row `index` (unchanged when it already shows). */
export function scrollToShow(index: number, scrollTop: number, viewport: number, rowHeight: number, header = 0): number {
  const top = index * rowHeight
  const bottom = top + rowHeight
  const view = Math.max(0, viewport - header)
  if (top < scrollTop) return top
  if (bottom > scrollTop + view) return bottom - view
  return scrollTop
}

// ── Trees ──

/** One visible row of a tree. */
export interface TreeRow {
  /** Dot-separated child indexes from the root (`0.2.1`): the `SelectedPath` and the expansion key. */
  readonly path: string
  readonly item: unknown
  /** 1 for a root item. */
  readonly level: number
  readonly hasChildren: boolean
  readonly expanded: boolean
  /** 1-based position among its siblings, and their number (`aria-posinset` / `aria-setsize`). */
  readonly posInSet: number
  readonly setSize: number
  /** The parent's path (`''` for a root item). */
  readonly parent: string
}

/** The rows of a tree that show: every root item, and the children of the expanded ones, depth first. */
export function flattenTree(roots: readonly unknown[], expanded: ReadonlySet<string>): TreeRow[] {
  const out: TreeRow[] = []
  const walk = (list: readonly unknown[], parent: string, level: number) => {
    list.forEach((item, k) => {
      const path = parent ? `${parent}.${k}` : String(k)
      const kids = itemChildren(item)
      const has = !!kids && kids.length > 0
      const open = has && expanded.has(path)
      out.push({ path, item, level, hasChildren: has, expanded: open, posInSet: k + 1, setSize: list.length, parent })
      if (open) walk(kids!, path, level + 1)
    })
  }
  walk(roots, '', 1)
  return out
}

/** The paths of the items marked `Expanded` (their initial state). */
export function initiallyExpanded(roots: readonly unknown[]): Set<string> {
  const out = new Set<string>()
  const walk = (list: readonly unknown[], parent: string) => {
    list.forEach((item, k) => {
      const path = parent ? `${parent}.${k}` : String(k)
      const kids = itemChildren(item)
      if (kids?.length && itemFlag(item, 'expanded')) out.add(path)
      if (kids?.length) walk(kids, path)
    })
  }
  walk(roots, '')
  return out
}

/**
 * Left / Right in a tree (WAI-ARIA tree pattern, mirrored in RTL): towards the children expands a closed item,
 * then goes to its first child; towards the parent collapses an open item, then goes to its parent.
 * Returns the new focused row and the expansion to apply, or `null` when the key does nothing.
 */
export function treeArrow(key: string, rows: readonly TreeRow[], at: number, rtl = false): { focus: number; expand?: string; collapse?: string } | null {
  const row = rows[at]
  if (!row) return null
  const inward = rtl ? 'ArrowLeft' : 'ArrowRight'
  const outward = rtl ? 'ArrowRight' : 'ArrowLeft'
  if (key === inward) {
    if (row.hasChildren && !row.expanded) return { focus: at, expand: row.path }
    if (row.hasChildren && row.expanded && rows[at + 1]?.parent === row.path) return { focus: at + 1 }
    return null
  }
  if (key === outward) {
    if (row.hasChildren && row.expanded) return { focus: at, collapse: row.path }
    if (row.parent) {
      const p = rows.findIndex((r) => r.path === row.parent)
      return p >= 0 ? { focus: p } : null
    }
    return null
  }
  return null
}
