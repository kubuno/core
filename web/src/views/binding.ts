/**
 * The binding engine: path resolution (VIEWS-SPEC §6.1 resolution order: the innermost template row, then
 * outwards, then the view instance, then its `dataContext`), converters, formatting.
 */
import type { PlanBinding } from './plan'

/** A binding scope: the view instance, and the template rows around the element (innermost first). */
export interface Scope {
  readonly vm: Record<string, unknown> & { dataContext?: unknown }
  readonly row?: unknown
  readonly index?: number
  readonly up?: Scope
}

/** The path does not resolve. */
export const UNSET: unique symbol = Symbol('unset')

export interface ValueConverter {
  convert(value: unknown, parameter: string | undefined, culture: string | undefined): unknown
  /** Absent: the converter does not convert back, a write-back through it is dropped. */
  convertBack?(value: unknown, parameter: string | undefined, culture: string | undefined): unknown
}

const isEmpty = (v: unknown): boolean => v == null || v === '' || (Array.isArray(v) && v.length === 0)
const str = (v: unknown): string => (v == null ? '' : String(v))

const converters = new Map<string, ValueConverter>([
  ['Not', { convert: (v) => !v, convertBack: (v) => !v }],
  ['IsEmpty', { convert: isEmpty }],
  ['IsNotEmpty', { convert: (v) => !isEmpty(v) }],
  ['ToUpper', { convert: (v) => str(v).toUpperCase() }],
  ['ToLower', { convert: (v) => str(v).toLowerCase() }],
  ['Trim', { convert: (v) => str(v).trim(), convertBack: (v) => str(v).trim() }],
  ['Equals', { convert: (v, p) => str(v) === str(p), convertBack: (v, p) => (v ? p : UNSET) }],
  ['NotEquals', { convert: (v, p) => str(v) !== str(p) }],
  ['BoolToText', { convert: (v, p) => (p ?? 'true|false').split('|')[v ? 0 : 1] ?? '' }],
  ['Count', { convert: (v) => (Array.isArray(v) || typeof v === 'string' ? v.length : 0) }],
])

/** Registers an application converter (it may replace a built-in one, VIEWS-SPEC §6.1). */
export function registerConverter(name: string, converter: ValueConverter): void {
  converters.set(name, converter)
}

const isObject = (v: unknown): v is Record<string, unknown> => (typeof v === 'object' || typeof v === 'function') && v !== null

/** The object owning the first segment of a path, by the resolution order. */
export function ownerOf(scope: Scope, first: string, depth: number): Record<string, unknown> | undefined {
  let s: Scope | undefined = scope
  for (let d = depth; d > 0 && s; d--, s = s.up) {
    if (isObject(s.row) && first in s.row) return s.row
  }
  const vm = scope.vm
  if (first in vm) return vm
  const dc = vm.dataContext
  return isObject(dc) && first in dc ? dc : vm
}

/** Reads `path` from `owner` (the compiled getter when there is one). */
function walk(owner: unknown, segs: readonly string[]): unknown {
  let v = owner
  for (const s of segs) {
    if (!isObject(v)) return undefined
    v = v[s]
  }
  return v
}

/** The source value of a binding in `scope` (`UNSET` when it does not resolve). */
export function readSource(b: PlanBinding, scope: Scope): unknown {
  const segs = b.path.split('.')
  const owner = ownerOf(scope, segs[0], b.depth ?? 0)
  if (!owner) return UNSET
  let v: unknown
  try {
    v = b.g ? (b.g as (o: unknown) => unknown)(owner) : walk(owner, segs)
  } catch {
    return UNSET
  }
  return v === undefined ? UNSET : v
}

/** The displayed value: source → converter → format, with `FallbackValue` / `TargetNullValue`. */
export function readBinding(b: PlanBinding, scope: Scope): unknown {
  let v = readSource(b, scope)
  if (v !== UNSET && b.conv) {
    const c = converters.get(b.conv)
    v = c ? c.convert(v, b.param, b.culture) : v
  }
  if (v === UNSET) return b.fallback ?? UNSET
  if (v === null && b.null !== undefined) return b.null
  if (b.format && v !== null) return format(v, b.format, b.culture)
  return v
}

/** Writes a user change back to the source; `false` when it is refused (no setter, converter declines). */
export function writeBinding(b: PlanBinding, scope: Scope, value: unknown): boolean {
  let v = value
  if (b.conv) {
    const c = converters.get(b.conv)
    if (c) {
      if (!c.convertBack) return false
      v = c.convertBack(v, b.param, b.culture)
      if (v === UNSET) return false
    }
  }
  if (b.null !== undefined && v === b.null) v = null
  const segs = b.path.split('.')
  const owner = ownerOf(scope, segs[0], b.depth ?? 0)
  if (!owner) return false
  try {
    if (b.s) (b.s as (o: unknown, v: unknown) => void)(owner, v)
    else {
      const parent = walk(owner, segs.slice(0, -1))
      if (!isObject(parent)) return false
      parent[segs[segs.length - 1]] = v
    }
    return true
  } catch (e) {
    console.warn(`[views] cannot write {Binding ${b.path}}:`, e)
    return false
  }
}

const NUMBER = /^([NnFfCcPpDd])(\d*)$/

function numberFormat(v: number, f: string, culture: string | undefined): string | null {
  const m = NUMBER.exec(f)
  if (!m) return null
  const p = m[2] === '' ? undefined : Number(m[2])
  const loc = culture && culture !== 'invariant' ? culture : undefined
  switch (m[1].toUpperCase()) {
    case 'N': return v.toLocaleString(loc, { minimumFractionDigits: p ?? 2, maximumFractionDigits: p ?? 2 })
    case 'F': return v.toFixed(p ?? 2)
    case 'C': return v.toLocaleString(loc, { style: 'currency', currency: 'EUR', minimumFractionDigits: p, maximumFractionDigits: p })
    case 'P': return (v * 100).toLocaleString(loc, { minimumFractionDigits: p ?? 2, maximumFractionDigits: p ?? 2 }) + ' %'
    default: return Math.trunc(v).toString().padStart(p ?? 0, '0')
  }
}

const pad = (n: number, w = 2): string => String(n).padStart(w, '0')

function dateFormat(d: Date, f: string, culture: string | undefined): string {
  const loc = culture && culture !== 'invariant' ? culture : undefined
  if (f === 'd') return d.toLocaleDateString(loc)
  if (f === 'D') return d.toLocaleDateString(loc, { dateStyle: 'full' })
  if (f === 't') return d.toLocaleTimeString(loc, { timeStyle: 'short' })
  if (f === 'T') return d.toLocaleTimeString(loc)
  if (f === 'g' || f === 'G') return d.toLocaleString(loc)
  return f.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, (t) =>
    t === 'yyyy' ? String(d.getFullYear()) : t === 'yy' ? pad(d.getFullYear() % 100)
      : t === 'MM' ? pad(d.getMonth() + 1) : t === 'dd' ? pad(d.getDate())
      : t === 'HH' ? pad(d.getHours()) : t === 'mm' ? pad(d.getMinutes()) : pad(d.getSeconds()))
}

/** One value with a .NET-style format (`N2`, `C`, `d`, `dd/MM/yyyy`, `#,##0.00`). */
export function formatValue(v: unknown, f: string, culture?: string): string {
  if (typeof v === 'number') {
    const n = numberFormat(v, f, culture)
    if (n !== null) return n
    const m = /^[#,0]*(?:\.(0+))?$/.exec(f)
    if (m) return v.toLocaleString(culture, { useGrouping: f.includes(','), minimumFractionDigits: m[1]?.length ?? 0, maximumFractionDigits: m[1]?.length ?? 0 })
  }
  const date = v instanceof Date ? v : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? new Date(v) : null
  if (date && !Number.isNaN(date.getTime())) return dateFormat(date, f, culture)
  return String(v)
}

/** `StringFormat`: a composite (`'Total: {0:N2}'`) or a single format (`N2`). */
export function format(v: unknown, f: string, culture?: string): string {
  if (f.includes('{0')) return f.replace(/\{0(?::([^}]*))?\}/g, (_, inner?: string) => (inner ? formatValue(v, inner, culture) : String(v)))
  return formatValue(v, f, culture)
}
