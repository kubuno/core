import React from 'react'

import { cn } from './cn'
import { sizedIcon } from './sizedIcon'

/** One cell of a `StatusBar`. A text of a single dash is a separator. */
export interface StatusLabelDef {
  id?: string
  text?: string
  icon?: React.ReactNode
  /** Takes the width the other cells leave. */
  spring?: boolean
  /** A button: lit under the pointer, raises its click. */
  clickable?: boolean
  disabled?: boolean
  onClick?: () => void
}

export interface StatusBarProps {
  items: StatusLabelDef[]
  /** A clickable cell was clicked: the cell and its index. */
  onItemClick?: (item: StatusLabelDef, index: number) => void
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

/**
 * The status line at the bottom of a window or a pane (the `.kbview` `StatusBar`): small cells of text, separators,
 * a spring cell that pushes the next ones to the end, clickable cells. `role="status"`: screen readers announce its
 * changes politely.
 */
export const StatusBar = React.forwardRef<HTMLDivElement, StatusBarProps>(function StatusBar(
  { items, onItemClick, className, style, ...aria },
  ref,
) {
  return (
    <div
      ref={ref}
      role="status"
      className={cn('flex items-center h-6 px-2 gap-1 bg-surface-1 border-t border-border text-xs text-text-secondary min-w-0 overflow-hidden', className)}
      style={style}
      {...aria}
    >
      {items.map((it, i) => {
        if (it.text === '-') {
          return <span key={it.id ?? i} role="separator" aria-orientation="vertical" className="w-px h-3.5 bg-border mx-1 flex-shrink-0" />
        }
        const body = (
          <>
            {sizedIcon(it.icon, 14)}
            {it.text && <span className="truncate">{it.text}</span>}
          </>
        )
        const cls = cn('inline-flex items-center gap-1 h-5 px-1.5 rounded min-w-0', it.spring ? 'flex-1' : 'flex-shrink-0')
        if (!it.clickable) return <span key={it.id ?? i} className={cls}>{body}</span>
        return (
          <button
            key={it.id ?? i}
            type="button"
            disabled={it.disabled}
            onClick={() => { it.onClick?.(); onItemClick?.(it, i) }}
            className={cn(cls, 'hover:bg-surface-3 hover:text-text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50')}
          >
            {body}
          </button>
        )
      })}
    </div>
  )
})

StatusBar.displayName = 'StatusBar'
