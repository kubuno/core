import { clsx } from 'clsx'

interface FloatCheckboxProps {
  selected: boolean
  onToggle: () => void
  className?: string
}

/**
 * Circular floating checkbox used for multi-select over media cards (files, photos…).
 * Invisible by default; appears on parent hover and stays visible when selected.
 * Wrap the parent container with `group` to enable the hover reveal.
 */
export function FloatCheckbox({ selected, onToggle, className }: FloatCheckboxProps) {
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      onClick={e => { e.stopPropagation(); onToggle() }}
      className={clsx(
        'transition-opacity cursor-pointer',
        selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        className,
      )}
    >
      <div
        className={clsx(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors',
          selected ? 'bg-primary border-primary' : 'bg-black/30 border-white',
        )}
      >
        {selected && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
      </div>
    </div>
  )
}
