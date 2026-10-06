/**
 * Backward-compatible `getDateLocale()` for modules still built on date-fns.
 *
 * WHY THIS EXISTS
 * The SDK used to export `getDateLocale()`, which returned a date-fns `Locale`
 * for the active language. Removing it was a breaking change of the SDK
 * contract without a version bump: every installed module that imported it,
 * built weeks earlier, failed at import time with "does not provide an export
 * named 'getDateLocale'" and was silently dropped from the shell. The host must
 * keep loading what is installed.
 *
 * WHAT THIS IS
 * A date-fns 4 compatible `Locale` object, built entirely from the platform's
 * `Intl` APIs (no date-fns dependency in the host). It covers what `format`,
 * `parse`, `formatDistance*` and `formatRelative` read from a locale: `localize`,
 * `formatLong`, `match`, `formatDistance`, `formatRelative` and `options`.
 *
 * It is a bridge, not a destination: new code uses the intent-based API of
 * `./datetime` and never touches this file. Once no installed module imports
 * `getDateLocale` any more, delete it together with an SDK version bump.
 */

import i18n from '../i18n'

type Width = 'narrow' | 'short' | 'abbreviated' | 'wide'
type Context = 'formatting' | 'standalone'
type LongWidth = 'full' | 'long' | 'medium' | 'short'
type DayPeriod = 'am' | 'pm' | 'midnight' | 'noon' | 'morning' | 'afternoon' | 'evening' | 'night'

interface LocalizeOptions { width?: Width; context?: Context; unit?: string }
interface MatchOptions { width?: Width; context?: Context; valueCallback?: (value: unknown) => unknown }
interface MatchResult { value: unknown; rest: string }
interface DistanceOptions { addSuffix?: boolean; comparison?: number }

/** Structural twin of date-fns 4's `Locale`: the host no longer ships date-fns. */
export interface DateFnsLocale {
  code: string
  formatDistance: (token: string, count: number, options?: DistanceOptions) => string
  formatRelative: (token: string, date: Date, baseDate: Date, options?: unknown) => string
  localize: {
    ordinalNumber: (n: number, options?: LocalizeOptions) => string
    era: (era: number, options?: LocalizeOptions) => string
    quarter: (quarter: number, options?: LocalizeOptions) => string
    month: (month: number, options?: LocalizeOptions) => string
    day: (day: number, options?: LocalizeOptions) => string
    dayPeriod: (period: DayPeriod, options?: LocalizeOptions) => string
  }
  formatLong: {
    date: (options?: { width?: LongWidth }) => string
    time: (options?: { width?: LongWidth }) => string
    dateTime: (options?: { width?: LongWidth }) => string
  }
  match: {
    ordinalNumber: (s: string, options?: MatchOptions) => MatchResult | null
    era: (s: string, options?: MatchOptions) => MatchResult | null
    quarter: (s: string, options?: MatchOptions) => MatchResult | null
    month: (s: string, options?: MatchOptions) => MatchResult | null
    day: (s: string, options?: MatchOptions) => MatchResult | null
    dayPeriod: (s: string, options?: MatchOptions) => MatchResult | null
  }
  options: { weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6; firstWeekContainsDate: 1 | 2 | 3 | 4 | 5 | 6 | 7 }
}

// ---------------------------------------------------------------------------
// Intl helpers

const WIDTHS: Width[] = ['wide', 'abbreviated', 'short', 'narrow']
const INTL_TEXT: Record<Width, 'long' | 'short' | 'narrow'> = {
  wide: 'long', abbreviated: 'short', short: 'short', narrow: 'narrow',
}
const DAY_PERIOD_HOUR: Record<DayPeriod, number> = {
  am: 9, pm: 21, midnight: 0, noon: 12, morning: 9, afternoon: 15, evening: 19, night: 23,
}
const DAY_PERIODS = Object.keys(DAY_PERIOD_HOUR) as DayPeriod[]

function part(lng: string, opts: Intl.DateTimeFormatOptions, d: Date, type: string): string {
  const p = new Intl.DateTimeFormat(lng, opts).formatToParts(d).find((x) => x.type === type)
  return p?.value ?? ''
}

function base(lng: string): string {
  return lng.split('-')[0].toLowerCase()
}

/** Words must be quoted in a date-fns pattern; punctuation and spaces stay bare. */
function literal(text: string): string {
  return text.replace(/[\p{L}\p{M}'’]+/gu, (w) => `'${w.replace(/'/g, "''")}'`)
}

// ---------------------------------------------------------------------------
// Builders (all results are memoised on the returned object)

function buildNames(lng: string) {
  const cache = new Map<string, string[]>()
  const months = (width: Width, context: Context): string[] => {
    const key = `m|${width}|${context}`
    let v = cache.get(key)
    if (!v) {
      const opts: Intl.DateTimeFormatOptions = context === 'formatting'
        ? { day: 'numeric', month: INTL_TEXT[width] }
        : { month: INTL_TEXT[width] }
      v = Array.from({ length: 12 }, (_, i) => part(lng, opts, new Date(2024, i, 15), 'month'))
      cache.set(key, v)
    }
    return v
  }
  const days = (width: Width): string[] => {
    const key = `d|${width}`
    let v = cache.get(key)
    if (!v) {
      // 7 January 2024 is a Sunday: index 0 is Sunday, as in date-fns.
      v = Array.from({ length: 7 }, (_, i) => part(lng, { weekday: INTL_TEXT[width] }, new Date(2024, 0, 7 + i), 'weekday'))
      cache.set(key, v)
    }
    return v
  }
  const eras = (width: Width): string[] => {
    const key = `e|${width}`
    let v = cache.get(key)
    if (!v) {
      const opts: Intl.DateTimeFormatOptions = { era: INTL_TEXT[width], year: 'numeric' }
      v = [part(lng, opts, new Date(-100, 0, 1), 'era'), part(lng, opts, new Date(2024, 0, 1), 'era')]
      cache.set(key, v)
    }
    return v
  }
  const dayPeriod = (period: DayPeriod, width: Width): string => {
    const key = `p|${period}|${width}`
    let v = cache.get(key)
    if (!v) {
      const d = new Date(2024, 0, 15, DAY_PERIOD_HOUR[period])
      const opts: Intl.DateTimeFormatOptions = period === 'am' || period === 'pm'
        ? { hour: 'numeric', hour12: true }
        : { hour: 'numeric', hour12: true, dayPeriod: INTL_TEXT[width] }
      v = [part(lng, opts, d, 'dayPeriod') || (period === 'am' ? 'AM' : 'PM')]
      cache.set(key, v)
    }
    return v[0]
  }
  return { months, days, eras, dayPeriod }
}

function buildOrdinal(lng: string): (n: number, unit?: string) => string {
  const b = base(lng)
  // French: "1er" always; other day numbers stay bare ("5 septembre"), other units take "e".
  if (b === 'fr') return (n, unit) => (n === 1 ? '1er' : unit === 'date' || unit === 'day' ? String(n) : `${n}e`)
  if (b === 'en') {
    const rules = new Intl.PluralRules(lng, { type: 'ordinal' })
    const suffix: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' }
    return (n) => `${n}${suffix[rules.select(n)] ?? 'th'}`
  }
  if (b === 'de') return (n) => `${n}.`
  return (n) => String(n)
}

/** Translate what `Intl` prints for a style into the date-fns pattern that prints it. */
function buildFormatLong(lng: string, names: ReturnType<typeof buildNames>) {
  // Tuesday 5 September 2023, 08:04:06. September, because its abbreviated name
  // differs from its full name in every language we ship (March does not in French).
  const sample = new Date(2023, 8, 5, 8, 4, 6)
  const cache = new Map<string, string>()

  const toPattern = (parts: Intl.DateTimeFormatPart[]): string => {
    const hasDayPeriod = parts.some((p) => p.type === 'dayPeriod')
    return parts.map((p) => {
      const v = p.value
      switch (p.type) {
        // Always the full year, as every date-fns locale does for `P`.
        case 'year': return 'y'
        case 'month':
          if (/^\d+$/.test(v)) return v.length === 2 ? 'MM' : 'M'
          return names.months('wide', 'formatting').includes(v) ? 'MMMM' : 'MMM'
        case 'day': return v.length === 2 ? 'dd' : 'd'
        case 'weekday': return names.days('wide').includes(v) ? 'EEEE' : 'EEE'
        case 'hour': return hasDayPeriod ? (v.length === 2 ? 'hh' : 'h') : (v.length === 2 ? 'HH' : 'H')
        case 'minute': return 'mm'
        case 'second': return 'ss'
        case 'dayPeriod': return 'a'
        case 'timeZoneName': return v.length > 5 ? 'zzzz' : 'z'
        case 'era': return 'G'
        default: return literal(v)
      }
    }).join('')
  }

  const date = (width: LongWidth): string => {
    const key = `date|${width}`
    let v = cache.get(key)
    if (!v) {
      v = toPattern(new Intl.DateTimeFormat(lng, { dateStyle: width }).formatToParts(sample))
      cache.set(key, v)
    }
    return v
  }
  const time = (width: LongWidth): string => {
    const key = `time|${width}`
    let v = cache.get(key)
    if (!v) {
      v = toPattern(new Intl.DateTimeFormat(lng, { timeStyle: width }).formatToParts(sample))
      cache.set(key, v)
    }
    return v
  }
  // "{{date}} 'à' {{time}}": the connective is whatever Intl puts between the
  // two halves when asked for both at once.
  const dateTime = (width: LongWidth): string => {
    const key = `dt|${width}`
    let v = cache.get(key)
    if (!v) {
      const both = new Intl.DateTimeFormat(lng, { dateStyle: width, timeStyle: width }).format(sample)
      const d = new Intl.DateTimeFormat(lng, { dateStyle: width }).format(sample)
      const t = new Intl.DateTimeFormat(lng, { timeStyle: width }).format(sample)
      if (both.includes(d) && both.includes(t)) {
        v = both.replace(d, '\u0000D\u0000').replace(t, '\u0000T\u0000')
          .split('\u0000')
          .map((s) => (s === 'D' ? '{{date}}' : s === 'T' ? '{{time}}' : literal(s)))
          .join('')
      } else {
        v = '{{date}} {{time}}'
      }
      cache.set(key, v)
    }
    return v
  }
  return { date, time, dateTime }
}

/** Longest localized name the string starts with (case-insensitive). */
function matchIn(s: string, lists: string[][], options?: MatchOptions): MatchResult | null {
  const lower = s.toLowerCase()
  let best: { index: number; len: number } | null = null
  for (const list of lists) {
    list.forEach((name, index) => {
      const n = name.toLowerCase()
      if (n && lower.startsWith(n) && (!best || n.length > best.len)) best = { index, len: n.length }
    })
  }
  if (!best) return null
  const { index, len } = best as { index: number; len: number }
  const value = options?.valueCallback ? options.valueCallback(index) : index
  return { value, rest: s.slice(len) }
}

function buildDistance(lng: string) {
  const b = base(lng)
  const QUALIFIERS: Record<string, Record<string, string>> = {
    lessThan: { en: 'less than ', fr: 'moins de ' },
    about:    { en: 'about ',     fr: 'environ ' },
    over:     { en: 'over ',      fr: 'plus de ' },
    almost:   { en: 'almost ',    fr: 'presque ' },
  }
  const UNIT: Record<string, Intl.RelativeTimeFormatUnit> = {
    lessThanXSeconds: 'second', xSeconds: 'second', halfAMinute: 'second',
    lessThanXMinutes: 'minute', xMinutes: 'minute',
    aboutXHours: 'hour', xHours: 'hour', xDays: 'day',
    aboutXWeeks: 'week', xWeeks: 'week', aboutXMonths: 'month', xMonths: 'month',
    aboutXYears: 'year', xYears: 'year', overXYears: 'year', almostXYears: 'year',
  }
  const qualifierOf = (token: string): string => {
    const kind = token.startsWith('lessThan') ? 'lessThan'
      : token.startsWith('about') ? 'about'
      : token.startsWith('over') ? 'over'
      : token.startsWith('almost') ? 'almost' : ''
    return kind ? (QUALIFIERS[kind][b] ?? '') : ''
  }
  const relative = new Intl.RelativeTimeFormat(lng, { numeric: 'always' })
  const units = new Map<string, Intl.NumberFormat>()
  const plain = (count: number, unit: string): string => {
    let f = units.get(unit)
    if (!f) {
      f = new Intl.NumberFormat(lng, { style: 'unit', unit, unitDisplay: 'long' })
      units.set(unit, f)
    }
    return f.format(count)
  }
  return (token: string, count: number, options?: DistanceOptions): string => {
    const unit = UNIT[token] ?? 'second'
    const n = token === 'halfAMinute' ? 30 : count
    const qualifier = qualifierOf(token)
    if (!options?.addSuffix) return qualifier + plain(n, unit)
    const signed = (options.comparison ?? 0) > 0 ? n : -n
    // Insert the qualifier before the number: "il y a environ 3 heures".
    return relative.formatToParts(signed, unit)
      .map((p) => (p.type === 'integer' ? qualifier + p.value : p.value))
      .join('')
  }
}

function buildRelative(lng: string, formatLong: ReturnType<typeof buildFormatLong>) {
  const auto = new Intl.RelativeTimeFormat(lng, { numeric: 'auto' })
  // The word between date and time, e.g. " 'à' ", taken from the long dateTime pattern.
  const at = (): string => {
    const m = formatLong.dateTime('long').match(/\{\{date\}\}(.*)\{\{time\}\}/)
    return m ? m[1] : ' '
  }
  return (token: string): string => {
    switch (token) {
      case 'yesterday': return literal(auto.format(-1, 'day')) + at() + 'p'
      case 'today': return literal(auto.format(0, 'day')) + at() + 'p'
      case 'tomorrow': return literal(auto.format(1, 'day')) + at() + 'p'
      case 'lastWeek':
      case 'nextWeek': return 'eeee' + at() + 'p'
      default: return 'P'
    }
  }
}

function buildOptions(lng: string): DateFnsLocale['options'] {
  try {
    const loc = new Intl.Locale(lng) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number; minimalDays: number }
      weekInfo?: { firstDay: number; minimalDays: number }
    }
    const wi = loc.getWeekInfo?.() ?? loc.weekInfo
    if (wi) {
      return {
        weekStartsOn: (wi.firstDay % 7) as DateFnsLocale['options']['weekStartsOn'],
        firstWeekContainsDate: (Math.min(Math.max(wi.minimalDays, 1), 7)) as DateFnsLocale['options']['firstWeekContainsDate'],
      }
    }
  } catch { /* unknown tag: fall through to the convention below */ }
  return base(lng) === 'en'
    ? { weekStartsOn: 0, firstWeekContainsDate: 1 }
    : { weekStartsOn: 1, firstWeekContainsDate: 4 }
}

function buildLocale(lng: string): DateFnsLocale {
  const names = buildNames(lng)
  const ordinal = buildOrdinal(lng)
  const formatLong = buildFormatLong(lng, names)
  const b = base(lng)
  const quarterWide = (q: number) => (b === 'fr' ? `${q}${q === 1 ? 'er' : 'e'} trimestre` : `${ordinal(q)} quarter`)
  const quarterAbbr = (q: number) => (b === 'fr' ? `T${q}` : `Q${q}`)
  const dayPeriodNames = (width: Width) => DAY_PERIODS.map((p) => names.dayPeriod(p, width))

  return {
    code: lng,
    formatDistance: buildDistance(lng),
    formatRelative: buildRelative(lng, formatLong),
    localize: {
      ordinalNumber: (n, o) => ordinal(n, o?.unit),
      era: (era, o) => names.eras(o?.width ?? 'wide')[era] ?? '',
      quarter: (q, o) => (o?.width === 'narrow' ? String(q) : o?.width === 'wide' ? quarterWide(q) : quarterAbbr(q)),
      month: (m, o) => names.months(o?.width ?? 'wide', o?.context ?? 'standalone')[m] ?? '',
      day: (d, o) => names.days(o?.width ?? 'wide')[d] ?? '',
      dayPeriod: (p, o) => names.dayPeriod(p, o?.width ?? 'wide'),
    },
    formatLong: {
      date: (o) => formatLong.date(o?.width ?? 'full'),
      time: (o) => formatLong.time(o?.width ?? 'full'),
      dateTime: (o) => formatLong.dateTime(o?.width ?? 'full'),
    },
    match: {
      ordinalNumber: (s, o) => {
        const m = /^(\d+)(?:st|nd|rd|th|er|e|\.)?/i.exec(s)
        if (!m) return null
        const value = o?.valueCallback ? o.valueCallback(parseInt(m[1], 10)) : parseInt(m[1], 10)
        return { value, rest: s.slice(m[0].length) }
      },
      era: (s, o) => matchIn(s, WIDTHS.map((w) => names.eras(w)), o),
      quarter: (s, o) => {
        const m = /^[1-4]/.exec(s)
        if (!m) return null
        const q = parseInt(m[0], 10)
        return { value: o?.valueCallback ? o.valueCallback(q) : q, rest: s.slice(1) }
      },
      month: (s, o) => matchIn(s, WIDTHS.flatMap((w) => [names.months(w, 'formatting'), names.months(w, 'standalone')]), o),
      day: (s, o) => matchIn(s, WIDTHS.map((w) => names.days(w)), o),
      dayPeriod: (s, o) => {
        const r = matchIn(s, WIDTHS.map((w) => dayPeriodNames(w)))
        if (!r) return null
        const period = DAY_PERIODS[r.value as number]
        return { value: o?.valueCallback ? o.valueCallback(period) : period, rest: r.rest }
      },
    },
    options: buildOptions(lng),
  }
}

const locales = new Map<string, DateFnsLocale>()

/**
 * @deprecated Modules should format through `formatDate` / `formatRelative`
 * (see `./datetime`) rather than through date-fns. Kept so that modules built
 * against an earlier SDK keep loading.
 */
export function getDateLocale(lng?: string): DateFnsLocale {
  const key = lng || i18n?.language || 'en'
  let v = locales.get(key)
  if (!v) {
    v = buildLocale(key)
    locales.set(key, v)
  }
  return v
}
