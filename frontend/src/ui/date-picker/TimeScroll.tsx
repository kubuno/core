import { useRef, useEffect } from 'react'
import { clsx } from 'clsx'

/** Vertical scroller used for hours and minutes; auto-centers the selection. */
export function TimeScroll({
  values, selected, onSelect, label,
}: {
  values:   number[]
  selected: number
  onSelect: (v: number) => void
  label:    string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const selRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const el  = selRef.current
    const box = listRef.current
    if (!el || !box) return
    box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2
  }, [selected, label])

  return (
    <div className="flex flex-col items-center w-14">
      <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">
        {label}
      </span>
      <div
        ref={listRef}
        className="relative overflow-y-auto h-40"
        style={{ scrollbarWidth: 'none' }}
      >
        {values.map(v => (
          <button
            key={v}
            ref={v === selected ? selRef : undefined}
            type="button"
            onClick={() => onSelect(v)}
            className={clsx(
              'w-14 h-8 flex items-center justify-center text-sm rounded transition-colors',
              v === selected
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-text-primary hover:bg-surface-2',
            )}
          >
            {String(v).padStart(2, '0')}
          </button>
        ))}
      </div>
    </div>
  )
}
