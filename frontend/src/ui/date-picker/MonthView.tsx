import type { Dispatch, SetStateAction } from 'react'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getYear, getMonth } from 'date-fns'
import { MONTHS_FR } from './helpers'
import type { PickerView } from './types'

/** Month grid of the displayed year. */
export function MonthView({
  viewDate, setViewDate, setView, selected,
}: {
  viewDate:    Date
  setViewDate: Dispatch<SetStateAction<Date>>
  setView:     Dispatch<SetStateAction<PickerView>>
  selected:    Date | null
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <button
          type="button"
          onClick={() => setViewDate(d => { const n = new Date(d); n.setFullYear(getYear(d) - 1); return n })}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => setView('year')}
          className="flex-1 text-sm font-semibold text-center text-text-primary hover:text-primary transition-colors rounded hover:bg-surface-1 py-0.5"
        >
          {getYear(viewDate)}
        </button>
        <button
          type="button"
          onClick={() => setViewDate(d => { const n = new Date(d); n.setFullYear(getYear(d) + 1); return n })}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {MONTHS_FR.map((name, idx) => {
          const isSel = selected && getMonth(selected) === idx && getYear(selected) === getYear(viewDate)
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setViewDate(d => { const n = new Date(d); n.setMonth(idx); return n })
                setView('day')
              }}
              className={clsx(
                'h-9 rounded-lg text-sm font-medium transition-colors',
                isSel ? 'bg-primary text-white' : 'text-text-primary hover:bg-surface-2',
              )}
            >
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
