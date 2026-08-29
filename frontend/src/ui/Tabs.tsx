import React, { useCallback, useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TFunction } from 'i18next'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TabDef<T extends string = string> {
  id:     T
  label:  string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?:  React.ComponentType<any>
  badge?: number | string
}

export interface TabsProps<T extends string = string> {
  tabs:       TabDef<T>[]
  value:      T
  onChange:   (value: T) => void
  /** Extra classes applied to the outer container */
  className?: string
  /** Label text is the default size either way; the sizes differ only in padding.
   *  'sm' → px-3 py-1.5  |  'md' (default) → px-4 py-2 */
  size?:      'sm' | 'md'
  /**
   * underline (default) — bottom-border indicator, horizontal scroll
   * pills               — rounded pill background, no border
   * stretched           — each tab fills equal width, bottom border
   *
   * Every variant is exactly as tall as its tallest tab.
   */
  variant?:   'underline' | 'pills' | 'stretched'
  /** Localises the scroll-arrow labels; falls back to English when absent. */
  t?:         TFunction
}

const FALLBACK_LABELS: Record<string, string> = {
  tabs_scroll_left:  'Scroll tabs left',
  tabs_scroll_right: 'Scroll tabs right',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Tabs<T extends string = string>({
  tabs,
  value,
  onChange,
  className,
  size    = 'md',
  variant = 'underline',
  t,
}: TabsProps<T>) {
  const active = (id: T) => id === value
  const iconSize = size === 'sm' ? 14 : 16
  const tr = (k: string) => (t ? t(k) : (FALLBACK_LABELS[k] ?? k))

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState({ left: false, right: false })

  const syncArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    // 1px slack: fractional layout widths would otherwise leave a phantom arrow
    const max = el.scrollWidth - el.clientWidth
    setCanScroll(prev => {
      const next = { left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 }
      return prev.left === next.left && prev.right === next.right ? prev : next
    })
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || variant !== 'underline') return
    syncArrows()
    el.addEventListener('scroll', syncArrows, { passive: true })
    // watch the strip and each tab: a relabelled or re-rendered tab changes the
    // scrollable width without ever firing a scroll event
    const ro = new ResizeObserver(syncArrows)
    ro.observe(el)
    for (const child of Array.from(el.children)) ro.observe(child)
    return () => {
      el.removeEventListener('scroll', syncArrows)
      ro.disconnect()
    }
  }, [syncArrows, variant, tabs.length])

  const scrollByPage = (direction: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * Math.max(120, el.clientWidth * 0.75), behavior: 'smooth' })
  }

  const containerCls = clsx(
    variant === 'pills'     && 'flex gap-1',
    variant === 'stretched' && 'flex border-b border-border',
    className,
  )

  // `underline` and `stretched` share the indicator; only their layout differs.
  const underlined = variant === 'underline' || variant === 'stretched'

  const btnCls = (id: T) => clsx(
    'flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors',
    // The indicator is a ::before, not a bottom border, so it can have rounded top
    // corners and sit inset from the tab's edges — a border can do neither. The
    // 3px it no longer occupies as a border is added back as bottom padding, so
    // the tab keeps exactly the height (and the text position) it had.
    size === 'sm' && (underlined ? 'px-3 pt-1.5 pb-[9px]'  : 'px-3 py-1.5'),
    size === 'md' && (underlined ? 'px-4 pt-2 pb-[11px]'   : 'px-4 py-2'),

    // underline / stretched share same active/inactive colors
    // No `-mb-px` here. It existed to make the old 3px BORDER overlap the container's
    // 1px divider, but the scrollable strip is `overflow-y-hidden` and sizes itself to
    // the tab's MARGIN box: a negative bottom margin makes the strip 1px shorter than
    // the tab, and that missing pixel is clipped straight off the indicator — a 3px
    // band rendering as 2. Measured.
    underlined && `relative before:absolute before:inset-x-0 before:bottom-0 before:mx-2
                   before:h-[3px] before:rounded-t-[3px] before:content-['']`,
    // Hover tints the whole tab, active or not — the pointer must get an answer
    // wherever it lands, not only on the tabs you have not selected.
    underlined && 'justify-center hover:bg-surface-2',
    underlined && active(id)  && 'text-primary before:bg-primary',
    underlined && !active(id) && 'text-text-secondary hover:text-text-primary',

    // stretched: equal-width
    variant === 'stretched' && 'flex-1 justify-center',

    // pills
    variant === 'pills' && 'rounded-md',
    variant === 'pills' && active(id)  && 'bg-primary-light text-primary',
    variant === 'pills' && !active(id) && 'text-text-secondary hover:bg-surface-2',
  )

  const arrowCls = 'flex shrink-0 items-center px-0.5 text-text-secondary transition-colors hover:text-text-primary'

  const items = tabs.map(tab => {
    const Icon = tab.icon
    return (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={active(tab.id)}
        onClick={() => onChange(tab.id)}
        className={btnCls(tab.id)}
      >
        {Icon && <Icon size={iconSize} />}
        {tab.label}
        {tab.badge !== undefined && (
          <span
            className={clsx(
              'rounded-full text-[11px] font-medium min-w-[18px] h-[18px] flex items-center justify-center px-1',
              active(tab.id)
                ? 'bg-primary text-white'
                : 'bg-surface-3 text-text-secondary',
            )}
          >
            {tab.badge}
          </span>
        )}
      </button>
    )
  })

  if (variant !== 'underline') {
    return <div className={containerCls} role="tablist">{items}</div>
  }

  // The bottom border and the caller's classes live on the outer box so that the
  // rule still spans the full width once the arrows and the scroller split it.
  return (
    <div className={clsx('flex items-stretch border-b border-border', className)}>
      {canScroll.left && (
        <button type="button" aria-label={tr('tabs_scroll_left')} className={arrowCls} onClick={() => scrollByPage(-1)}>
          <ChevronLeft size={iconSize} />
        </button>
      )}
      {/* no-scrollbar: an overflowing strip would otherwise reserve ~8px of layout
          height for the horizontal scrollbar, making it taller than its tallest tab */}
      <div
        ref={scrollerRef}
        className="no-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
      >
        {/* Every tab gets the width of the WIDEST one. `w-max` sizes the grid to its
            content, and `auto-cols-fr` then splits that width into equal columns —
            under a max-content constraint each equal track resolves to the largest
            item's natural width. Doing it in CSS rather than by measuring in JS keeps
            it correct when the font finishes loading or the language changes. */}
        <div role="tablist" className="grid w-max grid-flow-col auto-cols-fr gap-1">
          {items}
        </div>
      </div>
      {canScroll.right && (
        <button type="button" aria-label={tr('tabs_scroll_right')} className={arrowCls} onClick={() => scrollByPage(1)}>
          <ChevronRight size={iconSize} />
        </button>
      )}
    </div>
  )
}
