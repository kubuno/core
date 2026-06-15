import React, {
  useState, useRef, useEffect, useMemo, useCallback,
  type Dispatch, type SetStateAction,
} from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { Calendar, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, isValid, isToday, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, isBefore, isAfter, parseISO,
  getYear, getMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Types ─────────────────────────────────────────────────────────────────────

/** date → "YYYY-MM-DD" | time → "HH:mm" | datetime → "YYYY-MM-DDTHH:mm" | daterange → startValue/endValue */
export type DatePickerMode = 'date' | 'time' | 'datetime' | 'daterange'
type PickerView = 'day' | 'month' | 'year'

export interface DatePickerProps {
  mode?:          DatePickerMode
  /** Single-value modes: controlled value (ISO) */
  value?:         string | null
  onChange?:      (v: string | null) => void
  /** Range mode – start "YYYY-MM-DD" */
  startValue?:    string | null
  /** Range mode – end "YYYY-MM-DD" */
  endValue?:      string | null
  onRangeChange?: (start: string | null, end: string | null) => void

  label?:         React.ReactNode
  placeholder?:   string
  disabled?:      boolean
  readOnly?:      boolean
  /** Show an × button to clear the value */
  clearable?:     boolean
  required?:      boolean
  error?:         string
  hint?:          string
  /** Earliest selectable date "YYYY-MM-DD" */
  minDate?:       string
  /** Latest selectable date "YYYY-MM-DD" */
  maxDate?:       string
  /** Return true to disable a specific date */
  disabledDate?:  (d: Date) => boolean
  /** Minute step in time picker (default 5) */
  minuteStep?:    number

  size?:          'sm' | 'md'
  className?:     string
  id?:            string
  name?:          string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEEKDAYS   = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS_FR  = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function parseDateValue(v: string | null | undefined, mode: DatePickerMode): Date | null {
  if (!v) return null
  try {
    if (mode === 'time') {
      const [h, m] = v.split(':').map(Number)
      if (isNaN(h) || isNaN(m)) return null
      const d = new Date()
      d.setHours(h, m, 0, 0)
      return d
    }
    const d = parseISO(v)
    return isValid(d) ? d : null
  } catch {
    return null
  }
}

function formatDisplay(d: Date | null, mode: DatePickerMode): string {
  if (!d) return ''
  if (mode === 'date')     return format(d, 'dd/MM/yyyy')
  if (mode === 'time')     return format(d, 'HH:mm')
  if (mode === 'datetime') return format(d, 'dd/MM/yyyy HH:mm')
  return ''
}

function toISOValue(d: Date | null, mode: DatePickerMode): string | null {
  if (!d) return null
  if (mode === 'date')     return format(d, 'yyyy-MM-dd')
  if (mode === 'time')     return format(d, 'HH:mm')
  if (mode === 'datetime') return format(d, "yyyy-MM-dd'T'HH:mm")
  return null
}

function calendarGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end   = endOfWeek(endOfMonth(month),     { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

function yearGrid(anchor: number): number[] {
  const base = anchor - (anchor % 12)
  return Array.from({ length: 12 }, (_, i) => base + i)
}

// ── Popover positioning ───────────────────────────────────────────────────────

function computePos(
  trigger: HTMLElement,
  popH: number,
  popW: number,
): { top: number; left: number } {
  const r   = trigger.getBoundingClientRect()
  const below = window.innerHeight - r.bottom - 8
  const above = r.top - 8
  const top   = (below >= popH || below >= above)
    ? r.bottom + window.scrollY + 4
    : r.top + window.scrollY - popH - 4
  const left  = Math.max(8, Math.min(
    r.left + window.scrollX,
    window.innerWidth - popW - 8,
  ))
  return { top, left }
}

// ── TimeScroll ────────────────────────────────────────────────────────────────

function TimeScroll({
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

// ── CalendarView ──────────────────────────────────────────────────────────────

function CalendarView({
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

  const years = useMemo(() => yearGrid(getYear(viewDate)), [viewDate])

  // ── Day view ────────────────────────────────────────────────────────────────
  if (view === 'day') {
    const days = calendarGrid(viewDate)
    const mName = format(viewDate, 'MMMM', { locale: fr })
    const mNameCap = mName.charAt(0).toUpperCase() + mName.slice(1)

    return (
      <div>
        {/* Navigation header */}
        <div className="flex items-center gap-1 mb-2">
          <button
            type="button"
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex-1 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setView('month')}
              className="text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1"
            >
              {mNameCap}
            </button>
            <button
              type="button"
              onClick={() => setView('year')}
              className="text-sm font-semibold text-text-primary hover:text-primary transition-colors px-1 rounded hover:bg-surface-1"
            >
              {getYear(viewDate)}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 text-text-secondary transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-0.5">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="h-7 flex items-center justify-center text-[11px] font-medium text-text-tertiary">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7" onMouseLeave={() => setHoverDate?.(null)}>
          {days.map((d, i) => {
            const inM  = isSameMonth(d, viewDate)
            const sel  = !isRange && selected && isSameDay(d, selected)
            const edge = isEdge(d)
            const inR  = inRange(d)
            const dis  = isDis(d)
            const tod  = isToday(d)

            return (
              <button
                key={i}
                type="button"
                disabled={dis}
                onClick={() => !dis && onSelect(d)}
                onMouseEnter={() => setHoverDate?.(d)}
                className={clsx(
                  'h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium transition-colors',
                  // Edges and selected: full circle
                  (sel || edge) ? 'rounded-full bg-primary text-white' : '',
                  // In range: square highlight (no rounding)
                  !sel && !edge && inR ? 'bg-primary/10 text-primary' : '',
                  // Regular states
                  !sel && !edge && !inR && !dis && tod  ? 'rounded-full border border-primary text-primary hover:bg-primary-light' : '',
                  !sel && !edge && !inR && !dis && !tod && inM  ? 'rounded-full text-text-primary hover:bg-surface-2' : '',
                  !sel && !edge && !inR && !dis && !tod && !inM ? 'rounded-full text-text-tertiary hover:bg-surface-2' : '',
                  dis ? 'opacity-30 cursor-not-allowed rounded-full' : '',
                )}
              >
                {format(d, 'd')}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Month view ──────────────────────────────────────────────────────────────
  if (view === 'month') {
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

  // ── Year view ───────────────────────────────────────────────────────────────
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

// ── DatePicker (main) ─────────────────────────────────────────────────────────

export function DatePicker({
  mode = 'date',
  value,
  onChange,
  startValue,
  endValue,
  onRangeChange,
  label,
  placeholder,
  disabled = false,
  readOnly = false,
  clearable = false,
  required,
  error,
  hint,
  minDate,
  maxDate,
  disabledDate,
  minuteStep = 5,
  size = 'md',
  className,
  id,
  name,
}: DatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef     = useRef<HTMLDivElement>(null)

  const [open,     setOpen]     = useState(false)
  const [view,     setView]     = useState<PickerView>('day')
  const [viewDate, setViewDate] = useState<Date>(new Date)

  // Parsed values
  const selectedDate = useMemo(() => parseDateValue(value, mode), [value, mode])
  const rangeStart   = useMemo(() => parseDateValue(startValue, 'date'), [startValue])
  const rangeEnd     = useMemo(() => parseDateValue(endValue,   'date'), [endValue])

  // Time state (hours / minutes — kept in local state, committed on every change)
  const [hours,   setHoursLocal]   = useState(() => selectedDate?.getHours()   ?? 0)
  const [minutes, setMinutesLocal] = useState(() => selectedDate?.getMinutes() ?? 0)

  // Range picking state
  const [rangePhase,  setRangePhase]  = useState<'first' | 'second'>('first')
  const [localRangeS, setLocalRangeS] = useState<Date | null>(null)
  const [hoverDate,   setHoverDate]   = useState<Date | null>(null)
  const [pos,         setPos]         = useState({ top: 0, left: 0 })

  const inputId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  // ── Display text ───────────────────────────────────────────────────────────
  const displayText = useMemo(() => {
    if (mode === 'daterange') {
      const s = rangeStart
      const e = rangeEnd
      if (!s) return ''
      if (!e) return formatDisplay(s, 'date')
      return `${formatDisplay(s, 'date')} – ${formatDisplay(e, 'date')}`
    }
    return formatDisplay(selectedDate, mode)
  }, [mode, selectedDate, rangeStart, rangeEnd])

  // ── Open ───────────────────────────────────────────────────────────────────
  const openPicker = useCallback(() => {
    if (disabled || readOnly) return
    const trigger = triggerRef.current
    if (!trigger) return

    const popW = mode === 'time' ? 172 : 284
    const popH = mode === 'time' ? 230 : mode === 'datetime' ? 480 : 340
    setPos(computePos(trigger, popH, popW))

    // Sync viewDate
    const anchor = mode === 'daterange'
      ? (rangeStart ?? new Date())
      : (selectedDate ?? new Date())
    setViewDate(anchor)
    setView('day')

    // Sync time
    if (selectedDate && (mode === 'time' || mode === 'datetime')) {
      setHoursLocal(selectedDate.getHours())
      setMinutesLocal(selectedDate.getMinutes())
    }

    // Range phase
    if (mode === 'daterange') {
      setRangePhase('first')
      setLocalRangeS(null)
      setHoverDate(null)
    }

    setOpen(true)
  }, [disabled, readOnly, mode, selectedDate, rangeStart])

  // ── Close on outside click / Escape ───────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const onMouse = (e: MouseEvent) => {
      if (
        popRef.current     && !popRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown',   onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown',   onKey)
    }
  }, [open])

  // ── Date selection handler ─────────────────────────────────────────────────
  const handleSelectDate = useCallback((d: Date) => {
    if (mode === 'daterange') {
      if (rangePhase === 'first') {
        setLocalRangeS(d)
        setRangePhase('second')
        onRangeChange?.(toISOValue(d, 'date'), null)
      } else {
        const anchor = localRangeS ?? d
        const [lo, hi] = isBefore(anchor, d) ? [anchor, d] : [d, anchor]
        onRangeChange?.(toISOValue(lo, 'date'), toISOValue(hi, 'date'))
        setOpen(false)
      }
      return
    }

    if (mode === 'date') {
      onChange?.(toISOValue(d, 'date'))
      setOpen(false)
      return
    }

    if (mode === 'datetime') {
      const result = new Date(d)
      result.setHours(hours, minutes, 0, 0)
      onChange?.(toISOValue(result, 'datetime'))
      // Stay open for time adjustment
    }
  }, [mode, rangePhase, localRangeS, hours, minutes, onChange, onRangeChange])

  // ── Time commit helpers ────────────────────────────────────────────────────
  const commitTime = useCallback((h: number, m: number) => {
    const base = mode === 'datetime'
      ? (selectedDate ? new Date(selectedDate) : new Date())
      : new Date()
    base.setHours(h, m, 0, 0)
    onChange?.(toISOValue(base, mode))
  }, [mode, selectedDate, onChange])

  const handleHours = useCallback((h: number) => {
    setHoursLocal(h)
    commitTime(h, minutes)
  }, [minutes, commitTime])

  const handleMinutes = useCallback((m: number) => {
    setMinutesLocal(m)
    commitTime(hours, m)
  }, [hours, commitTime])

  // ── Clear ──────────────────────────────────────────────────────────────────
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (mode === 'daterange') onRangeChange?.(null, null)
    else onChange?.(null)
  }

  // ── Render helpers ─────────────────────────────────────────────────────────
  const hasValue    = mode === 'daterange' ? !!(startValue || endValue) : !!value
  const showClear   = clearable && hasValue && !disabled && !readOnly
  const triggerH    = size === 'sm' ? 'h-7 text-xs' : 'h-9 text-sm'
  const triggerIcon = mode === 'time' ? <Clock size={14} /> : <Calendar size={14} />

  const defaultPH = {
    date:      'jj/mm/aaaa',
    time:      'hh:mm',
    datetime:  'jj/mm/aaaa hh:mm',
    daterange: 'jj/mm/aaaa – jj/mm/aaaa',
  }[mode]

  const hourValues   = Array.from({ length: 24 }, (_, i) => i)
  const minuteValues = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep)

  const showCalendar = mode !== 'time'
  const showTime     = mode === 'time' || mode === 'datetime'
  const popW         = mode === 'time' ? 172 : 284

  const effectiveRangeStart = localRangeS ?? rangeStart
  const effectiveRangeEnd   = localRangeS ? null : rangeEnd

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {name && <input type="hidden" name={name} value={value ?? ''} readOnly />}

        <button
          ref={triggerRef}
          id={inputId}
          type="button"
          onClick={openPicker}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={clsx(
            'w-full flex items-center gap-2 px-3 rounded border bg-white text-left',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            error ? 'border-danger focus:ring-danger' : 'border-border',
            disabled && 'bg-surface-2 cursor-not-allowed opacity-60',
            readOnly && 'cursor-default',
            triggerH,
          )}
        >
          <span className="text-text-tertiary shrink-0">{triggerIcon}</span>
          <span className={clsx('flex-1 truncate', displayText ? 'text-text-primary' : 'text-text-tertiary')}>
            {displayText || (placeholder ?? defaultPH)}
          </span>
          {showClear ? (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
              tabIndex={-1}
            >
              <X size={13} />
            </button>
          ) : null}
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}

      {open && createPortal(
        <div
          ref={popRef}
          role="dialog"
          style={{ position: 'absolute', top: pos.top, left: pos.left, width: popW, zIndex: 9999 }}
          className="bg-white rounded-xl shadow-2xl border border-border"
        >
          <div className="p-3 select-none">
            {showCalendar && (
              <CalendarView
                viewDate={viewDate}
                setViewDate={setViewDate}
                view={view}
                setView={setView}
                selected={selectedDate}
                onSelect={handleSelectDate}
                rangeStart={effectiveRangeStart}
                rangeEnd={effectiveRangeEnd}
                hoverDate={hoverDate}
                setHoverDate={setHoverDate}
                isRange={mode === 'daterange'}
                minDate={minDate}
                maxDate={maxDate}
                disabledDate={disabledDate}
              />
            )}

            {showCalendar && showTime && (
              <div className="my-3 h-px bg-border" />
            )}

            {showTime && (
              <div className="flex items-start justify-center gap-1">
                <TimeScroll
                  values={hourValues}
                  selected={hours}
                  onSelect={handleHours}
                  label="Heure"
                />
                <span className="mt-8 text-text-tertiary text-base font-semibold">:</span>
                <TimeScroll
                  values={minuteValues}
                  selected={minuteValues.includes(minutes) ? minutes : minuteValues.reduce((a, b) => Math.abs(b - minutes) < Math.abs(a - minutes) ? b : a)}
                  onSelect={handleMinutes}
                  label="Min"
                />
              </div>
            )}

            {/* Pied de page : validation explicite pour les modes avec heure.
                La valeur est déjà appliquée en continu ; ces boutons servent à
                confirmer/fermer (et garantir une valeur si l'utilisateur n'a
                touché qu'à l'heure ou rien). */}
            {showTime && (
              <div className="flex items-center justify-between gap-2 pt-3 mt-1 border-t border-border">
                {showClear ? (
                  <button
                    type="button"
                    onClick={(e) => { handleClear(e); setOpen(false) }}
                    className="text-xs text-text-secondary hover:text-danger transition-colors"
                  >
                    Effacer
                  </button>
                ) : <span />}
                <button
                  type="button"
                  onClick={() => {
                    // Garantir une valeur même si l'utilisateur n'a pas cliqué de jour.
                    if (!value) {
                      const base = (mode === 'datetime' && selectedDate) ? new Date(selectedDate) : new Date()
                      base.setHours(hours, minutes, 0, 0)
                      onChange?.(toISOValue(base, mode))
                    }
                    setOpen(false)
                  }}
                  className="text-xs font-medium px-4 py-1.5 rounded bg-primary text-white hover:bg-primary-hover transition-colors"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
