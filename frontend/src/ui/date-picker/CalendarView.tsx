import { useMemo, useCallback, type Dispatch, type SetStateAction } from 'react'
import { isSameDay, isBefore, isAfter, parseISO } from 'date-fns'
import { DayView } from './DayView'
import { MonthView } from './MonthView'
import { YearView } from './YearView'
import type { PickerView } from './types'

/**
 * Calendar body of the picker: owns the day/month/year switching and the
 * range/disabled predicates shared by the day grid.
 */
export function CalendarView({
  viewDate, setViewDate, view, setView,
  selected, onSelect,
  rangeStart, rangeEnd, hoverDate, setHoverDate,
  isRange, minDate, maxDate, disabledDate,
}: {
  viewDate:      Date
  setViewDate:   Dispatch<SetStateAction<Date>>
  view:          PickerView
  setView:       Dispatch<SetStateAction<PickerView>>
  selected:      Date | null
  onSelect:      (d: Date) => void
  rangeStart?:   Date | null
  rangeEnd?:     Date | null
  hoverDate?:    Date | null
  setHoverDate?: (d: Date | null) => void
  isRange:       boolean
  minDate?:      string
  maxDate?:      string
  disabledDate?: (d: Date) => boolean
}) {
  const minD = minDate ? parseISO(minDate) : null
  const maxD = maxDate ? parseISO(maxDate) : null

  const isDis = useCallback((d: Date) => {
    if (minD && isBefore(d, minD)) return true
    if (maxD && isAfter(d,  maxD)) return true
    return disabledDate ? disabledDate(d) : false
  }, [minD, maxD, disabledDate])

  // Compute active range (while picking or fully picked)
  const rEnd = useMemo(() => {
    if (rangeEnd) return rangeEnd
    if (rangeStart && !rangeEnd && hoverDate) return hoverDate
    return null
  }, [rangeStart, rangeEnd, hoverDate])

  const inRange = useCallback((d: Date) => {
    if (!isRange || !rangeStart || !rEnd) return false
    const [lo, hi] = isBefore(rangeStart, rEnd) ? [rangeStart, rEnd] : [rEnd, rangeStart]
    return isAfter(d, lo) && isBefore(d, hi)
  }, [isRange, rangeStart, rEnd])

  const isEdge = useCallback((d: Date) => {
    if (!isRange) return false
    return (rangeStart && isSameDay(d, rangeStart)) || (rEnd && isSameDay(d, rEnd))
  }, [isRange, rangeStart, rEnd])

  if (view === 'day') {
    return (
      <DayView
        viewDate={viewDate}
        setViewDate={setViewDate}
        setView={setView}
        selected={selected}
        onSelect={onSelect}
        setHoverDate={setHoverDate}
        isRange={isRange}
        isDisabled={isDis}
        inRange={inRange}
        isEdge={isEdge}
      />
    )
  }

  if (view === 'month') {
    return (
      <MonthView
        viewDate={viewDate}
        setViewDate={setViewDate}
        setView={setView}
        selected={selected}
      />
    )
  }

  return (
    <YearView
      viewDate={viewDate}
      setViewDate={setViewDate}
      setView={setView}
      selected={selected}
    />
  )
}
