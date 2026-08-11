import {
  format, isValid,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  parseISO,
} from 'date-fns'
import type { DatePickerMode } from './types'

export const WEEKDAYS  = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
export const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

/** Parse a controlled value (ISO date/time) into a Date, `null` when unusable. */
export function parseDateValue(v: string | null | undefined, mode: DatePickerMode): Date | null {
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

/** Human-readable text shown in the trigger button. */
export function formatDisplay(d: Date | null, mode: DatePickerMode): string {
  if (!d) return ''
  if (mode === 'date')     return format(d, 'dd/MM/yyyy')
  if (mode === 'time')     return format(d, 'HH:mm')
  if (mode === 'datetime') return format(d, 'dd/MM/yyyy HH:mm')
  return ''
}

/** Serialize a Date back to the ISO shape expected by the caller. */
export function toISOValue(d: Date | null, mode: DatePickerMode): string | null {
  if (!d) return null
  if (mode === 'date')     return format(d, 'yyyy-MM-dd')
  if (mode === 'time')     return format(d, 'HH:mm')
  if (mode === 'datetime') return format(d, "yyyy-MM-dd'T'HH:mm")
  return null
}

/** Full 6-week grid (monday-first) covering the given month. */
export function calendarGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end   = endOfWeek(endOfMonth(month),     { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

/** 12-year page containing `anchor`. */
export function yearGrid(anchor: number): number[] {
  const base = anchor - (anchor % 12)
  return Array.from({ length: 12 }, (_, i) => base + i)
}

// ── Popover positioning ───────────────────────────────────────────────────────

export function computePos(
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

/** Popover width/height used both for positioning and rendering. */
export function popoverSize(mode: DatePickerMode): { w: number; h: number } {
  return {
    w: mode === 'time' ? 172 : 284,
    h: mode === 'time' ? 230 : mode === 'datetime' ? 480 : 340,
  }
}
