import React, { useRef, useState } from 'react'

import { cn } from './cn'
import { Tooltip } from './Tooltip'
import { sizedIcon } from './sizedIcon'

/** One command of a `Toolbar`. */
export interface ToolbarItemDef {
  /** Stable key (the runtime gives the item's x:Name or its position). */
  id?: string
  /** The command's text; empty for an icon-only command (its `tooltip` then names it). */
  text?: string
  icon?: React.ReactNode
  /** Shown under the pointer, and the accessible name of an icon-only command. */
  tooltip?: string
  disabled?: boolean
  onClick?: () => void
}

export interface ToolbarProps {
  items: ToolbarItemDef[]
  /** Paints a background band behind the commands. */
  band?: boolean
  /** Raised with the item and its index when a command is chosen. */
  onItemClick?: (item: ToolbarItemDef, index: number) => void
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

/** The next enabled index from `from` in `step` direction (wrapping), or `from` when none. */
export function nextEnabled(items: readonly { disabled?: boolean }[], from: number, step: 1 | -1): number {
  const n = items.length
  for (let k = 1; k <= n; k++) {
    const i = (((from + step * k) % n) + n) % n
    if (!items[i]?.disabled) return i
  }
  return from
}

/**
 * A row of commands (the `.kbview` `Toolbar`): ghost buttons with an icon and / or a text. One tab stop
 * (`role="toolbar"`, roving tabindex): the arrow keys move between the commands (mirrored in RTL), Home / End go
 * to the first / last, Enter or Space runs the focused one.
 */
export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { items, band = false, onItemClick, className, style, ...aria },
  ref,
) {
  const [active, setActive] = useState(() => Math.max(0, items.findIndex((it) => !it.disabled)))
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const current = Math.min(active, Math.max(0, items.length - 1))
  const focus = (i: number) => {
    setActive(i)
    buttons.current[i]?.focus()
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (e.key === forward) focus(nextEnabled(items, current, 1))
    else if (e.key === back) focus(nextEnabled(items, current, -1))
    else if (e.key === 'Home') focus(nextEnabled(items, -1, 1))
    else if (e.key === 'End') focus(nextEnabled(items, items.length, -1))
    else return
    e.preventDefault()
  }
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={cn('flex items-center gap-1 min-w-0', band && 'bg-surface-1 border-b border-border px-2 py-1', className)}
      style={style}
      {...aria}
    >
      {items.map((it, i) => {
        const iconOnly = !it.text
        const button = (
          <button
            key={it.id ?? i}
            ref={(el) => { buttons.current[i] = el }}
            type="button"
            tabIndex={i === current ? 0 : -1}
            disabled={it.disabled}
            aria-label={iconOnly ? it.tooltip : undefined}
            onFocus={() => setActive(i)}
            onClick={() => { it.onClick?.(); onItemClick?.(it, i) }}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 h-8 rounded-md text-sm text-text-secondary transition-colors',
              'hover:bg-surface-2 hover:text-text-primary active:bg-surface-3 outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'disabled:opacity-50 disabled:pointer-events-none',
              iconOnly ? 'w-8' : 'px-2.5',
            )}
          >
            {sizedIcon(it.icon, 16)}
            {it.text && <span className="truncate">{it.text}</span>}
          </button>
        )
        return it.tooltip ? <Tooltip key={it.id ?? i} label={it.tooltip}>{button}</Tooltip> : button
      })}
    </div>
  )
})

Toolbar.displayName = 'Toolbar'
