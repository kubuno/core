import React from 'react'
import { clsx } from 'clsx'

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
  /** 'sm' → px-3 py-1.5 text-xs  |  'md' (default) → px-4 py-2 text-sm */
  size?:      'sm' | 'md'
  /**
   * underline (default) — bottom-border indicator, horizontal scroll
   * pills               — rounded pill background, no border
   * stretched           — each tab fills equal width, bottom border
   */
  variant?:   'underline' | 'pills' | 'stretched'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Tabs<T extends string = string>({
  tabs,
  value,
  onChange,
  className,
  size    = 'md',
  variant = 'underline',
}: TabsProps<T>) {
  const active = (id: T) => id === value
  const iconSize = size === 'sm' ? 14 : 16

  const containerCls = clsx(
    variant === 'underline' && 'flex gap-1 border-b border-border overflow-x-auto overflow-y-hidden',
    variant === 'pills'     && 'flex gap-1',
    variant === 'stretched' && 'flex border-b border-border',
    className,
  )

  const btnCls = (id: T) => clsx(
    'flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors',
    size === 'sm' && 'px-3 py-1.5 text-xs',
    size === 'md' && 'px-4 py-2 text-sm',

    // underline / stretched share same active/inactive colors
    (variant === 'underline' || variant === 'stretched') && '-mb-px border-b-2',
    (variant === 'underline' || variant === 'stretched') && active(id)  && 'border-primary text-primary',
    (variant === 'underline' || variant === 'stretched') && !active(id) && 'border-transparent text-text-secondary hover:text-text-primary',

    // stretched: equal-width
    variant === 'stretched' && 'flex-1 justify-center',

    // pills
    variant === 'pills' && 'rounded-full',
    variant === 'pills' && active(id)  && 'bg-primary-light text-primary',
    variant === 'pills' && !active(id) && 'text-text-secondary hover:bg-surface-2',
  )

  return (
    <div className={containerCls}>
      {tabs.map(t => {
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={btnCls(t.id)}
          >
            {Icon && <Icon size={iconSize} />}
            {t.label}
            {t.badge !== undefined && (
              <span
                className={clsx(
                  'rounded-full text-[11px] font-medium min-w-[18px] h-[18px] flex items-center justify-center px-1',
                  active(t.id)
                    ? 'bg-primary text-white'
                    : 'bg-surface-3 text-text-secondary',
                )}
              >
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
