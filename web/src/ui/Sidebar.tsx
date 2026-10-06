import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from './cn'
import { Tooltip } from './Tooltip'
import { sizedIcon } from './sizedIcon'

/** One line of a `Sidebar`: a row (`kind` `item`) or a section header (`section`). */
export interface SidebarItemDef {
  kind?: 'item' | 'section'
  /** The runtime's stable key of the element (its x:Name, else its position). */
  id?: string
  /** The value of `SelectedItem` when the row is active (`Key`); empty: the x:Name, else the text. */
  key?: string
  text?: string
  icon?: React.ReactNode
  /** Rows under this one (shown indented once it is expanded). */
  items?: SidebarItemDef[]
  /** Children shown at first. */
  expanded?: boolean
  disabled?: boolean
  /** Indentation level of a row made from `ItemsSource` (0 = top). */
  level?: number
  onClick?: () => void
}

export interface SidebarProps {
  items?: SidebarItemDef[]
  /** Rows made from a list (fields Text, Icon, Key, Level, Kind = Section), instead of `items`. */
  source?: ReadonlyArray<Record<string, unknown>>
  /** The active row's key. */
  value?: string
  /** `true`: an icon rail (the labels as tooltips). */
  collapsed?: boolean
  /** A row was chosen (click, Enter or Space): its key. */
  onItemInvoked?: (key: string) => void
  /** The active row changed: its key. */
  onChange?: (key: string) => void
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

const INDEX_KEY = /^\d+(\.\d+)*$/

/** A row's key: its `Key`, else its x:Name (not a positional key), else its text. */
export function sidebarKey(it: SidebarItemDef): string {
  if (it.key) return it.key
  if (it.id && !INDEX_KEY.test(it.id)) return it.id
  return it.text ?? ''
}

/** Rows from a list: Text / Icon / Key / Level / Kind fields, in either case. */
export function sidebarRowsFrom(rows: ReadonlyArray<Record<string, unknown>>): SidebarItemDef[] {
  return rows.map((r) => {
    const get = (k: string) => r[k] ?? r[k.charAt(0).toLowerCase() + k.slice(1)]
    const kind = String(get('Kind') ?? '').toLowerCase() === 'section' ? 'section' : 'item'
    return {
      kind,
      key: get('Key') != null ? String(get('Key')) : undefined,
      text: get('Text') != null ? String(get('Text')) : '',
      icon: get('Icon') as React.ReactNode,
      level: Number(get('Level')) || 0,
      disabled: get('Enabled') === false,
    }
  })
}

// The shell's navigation rows (SidebarNavItem): same height, pill and colours.
const ACTIVE_BG = 'var(--color-primary-light, #d3e3fd)'
const HOVER_BG = 'var(--kb-sidebar-hover, #e8eaed)'

/**
 * A navigation list (the `.kbview` `Sidebar`): rows with an icon and a label, section headers, rows with children
 * that fold; the active row is marked (`aria-current="page"`). `Compact` shows an icon rail with the labels as
 * tooltips. The rows are links of a `<nav>`: Tab walks them, Enter or Space chooses one.
 */
export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { items = [], source, value, collapsed = false, onItemInvoked, onChange, className, style, ...aria },
  ref,
) {
  const [own, setOwn] = useState<string | undefined>(undefined)
  const active = value ?? own
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const rows = source ? sidebarRowsFrom(source) : items

  const choose = (it: SidebarItemDef) => {
    const key = sidebarKey(it)
    it.onClick?.()
    onItemInvoked?.(key)
    if (key !== active) {
      if (value === undefined) setOwn(key)
      onChange?.(key)
    }
  }

  const row = (it: SidebarItemDef, depth: number, k: number): React.ReactNode => {
    if (it.kind === 'section') {
      if (collapsed) return <li key={it.id ?? k} role="presentation" className="mx-3 my-2 h-px bg-border" />
      return (
        <li key={it.id ?? k} role="presentation" className="px-4 pt-4 pb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary truncate">
          {it.text}
        </li>
      )
    }
    const key = sidebarKey(it)
    const id = it.id ?? key
    const isActive = key === active
    const kids = it.items ?? []
    const shown = open[id] ?? !!it.expanded
    const level = depth + (it.level ?? 0)
    const activate = () => {
      if (it.disabled) return
      if (kids.length) setOpen((o) => ({ ...o, [id]: !shown }))
      choose(it)
    }
    const link = (
      <a
        href="#"
        aria-current={isActive ? 'page' : undefined}
        aria-disabled={it.disabled || undefined}
        aria-expanded={kids.length ? shown : undefined}
        aria-label={collapsed ? it.text : undefined}
        onClick={(e) => { e.preventDefault(); activate() }}
        onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); activate() } }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = HOVER_BG }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isActive ? ACTIVE_BG : 'transparent' }}
        className={cn(
          'relative flex items-center h-10 w-full px-2 rounded-full text-sm text-start no-underline outline-none overflow-hidden',
          'transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary',
          isActive ? 'text-primary font-medium' : 'text-text-secondary',
          it.disabled && 'opacity-50 cursor-not-allowed',
        )}
        style={{ backgroundColor: isActive ? ACTIVE_BG : 'transparent', paddingInlineStart: collapsed ? undefined : 8 + level * 16 }}
      >
        <span className="relative w-8 flex items-center justify-center flex-shrink-0">{sizedIcon(it.icon, 20)}</span>
        {!collapsed && <span className="truncate ms-2 flex-1">{it.text}</span>}
        {!collapsed && kids.length > 0 && (
          <ChevronDown size={16} className={cn('flex-shrink-0 transition-transform', !shown && '-rotate-90 rtl:rotate-90')} />
        )}
      </a>
    )
    return (
      <li key={id} role="presentation">
        {collapsed ? <Tooltip label={it.text ?? ''}>{link}</Tooltip> : link}
        {kids.length > 0 && shown && !collapsed && (
          <ul className="flex flex-col gap-0.5 mt-0.5">{kids.map((c, j) => row(c, level + 1, j))}</ul>
        )}
      </li>
    )
  }

  return (
    <nav ref={ref} className={cn('flex flex-col min-h-0', collapsed ? 'w-14' : 'w-full', className)} style={style} {...aria}>
      <ul className="flex flex-col gap-0.5 px-2 py-1">{rows.map((it, k) => row(it, 0, k))}</ul>
    </nav>
  )
})

Sidebar.displayName = 'Sidebar'
