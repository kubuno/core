import { useMemo, type Dispatch, type SetStateAction } from 'react'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getYear } from 'date-fns'
import { yearGrid } from './helpers'
import type { PickerView } from './types'

/** 12-year page. */
export function YearView({
  viewDate, setViewDate, setView, selected,
}: {
  viewDate:    Date
  setViewDate: Dispatch<SetStateAction<Date>>
  setView:     Dispatch<SetStateAction<PickerView>>
  selected:    Date | null
}) {
  const years = useMemo(() => yearGrid(getYear(viewDate)), [viewDate])

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <button
          type="button"
          onClick={() => setViewDate(d => { const n = new Date(d); n.setFullYear(getYear(d) - 12); return n })}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="flex-1 text-sm font-semibold text-center text-text-primary">
          {years[0]} – {years[years.length - 1]}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(d => { const n = new Date(d); n.setFullYear(getYear(d) + 12); return n })}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {years.map(y => {
          const isSel  = selected && getYear(selected) === y
          const isCur  = getYear(new Date()) === y
          return (
            <button
              key={y}
              type="button"
              onClick={() => {
                setViewDate(d => { const n = new Date(d); n.setFullYear(y); return n })
                setView('month')
              }}
              className={clsx(
                'h-9 rounded-lg text-sm font-medium transition-colors',
                isSel ? 'bg-primary text-white'
                : isCur ? 'border border-primary text-primary hover:bg-primary-light'
                : 'text-text-primary hover:bg-surface-2',
              )}
            >
              {y}
            </button>
          )
        })}
      </div>
    </div>
  )
}
