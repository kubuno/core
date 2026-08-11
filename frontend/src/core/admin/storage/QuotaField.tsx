import { useMemo } from 'react'
import { clsx } from 'clsx'
import { Input } from '@ui'

/**
 * A quota entered the way an operator says it — "50 Go" — rather than the way it
 * is stored.
 *
 * The stored value is a byte count, and a byte count is what an operator gets
 * wrong: `53687091200` and `5368709120` differ by one character and by a factor
 * of ten, and the settings page has been offering exactly that field. Here the
 * number and its unit are separate controls, and the byte value is shown
 * underneath so what is about to be written is never hidden.
 *
 * The unit is three buttons rather than a select: there are three of them, they
 * are one character wide, and `@ui`'s Dropdown does not follow the dark theme.
 */

const UNITS = [
  { id: 'MiB', label: 'Mo', factor: 1024 ** 2 },
  { id: 'GiB', label: 'Go', factor: 1024 ** 3 },
  { id: 'TiB', label: 'To', factor: 1024 ** 4 },
] as const

export type QuotaUnit = (typeof UNITS)[number]['id']

/** Splits a byte count into the largest unit that keeps it readable. */
export function splitQuota(bytes: number): { amount: string; unit: QuotaUnit } {
  for (const u of [...UNITS].reverse()) {
    if (bytes >= u.factor) {
      const v = bytes / u.factor
      // One decimal only when it carries information: "1,5 To", never "50,0 Go".
      return { amount: Number.isInteger(v) ? String(v) : v.toFixed(1), unit: u.id }
    }
  }
  return { amount: String(Math.max(1, Math.round(bytes / UNITS[0].factor))), unit: 'MiB' }
}

export function toBytes(amount: string, unit: QuotaUnit): number | null {
  const n = Number(amount.replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  const factor = UNITS.find(u => u.id === unit)?.factor ?? UNITS[1].factor
  return Math.round(n * factor)
}

export function QuotaField({
  amount, unit, onAmount, onUnit, label, hint, error, autoFocus,
}: {
  amount:   string
  unit:     QuotaUnit
  onAmount: (v: string) => void
  onUnit:   (u: QuotaUnit) => void
  label:    string
  hint?:    string
  error?:   string
  autoFocus?: boolean
}) {
  const bytes = useMemo(() => toBytes(amount, unit), [amount, unit])

  return (
    <div>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            label={label}
            value={amount}
            inputMode="decimal"
            autoFocus={autoFocus}
            onChange={e => onAmount(e.target.value)}
            error={error}
          />
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-md border border-border" role="group" aria-label={label}>
          {UNITS.map(u => (
            <button
              key={u.id}
              type="button"
              aria-pressed={unit === u.id}
              onClick={() => onUnit(u.id)}
              className={clsx(
                'px-3 py-2 transition-colors',
                unit === u.id
                  ? 'bg-primary-light text-primary'
                  : 'text-text-secondary hover:bg-surface-2',
              )}
              style={{ fontSize: 'var(--kb-text-body)' }}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {(hint || bytes != null) && (
        <p className="mt-1.5 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {hint}
          {hint && bytes != null ? ' · ' : ''}
          {bytes != null && <span className="tabular-nums">{bytes.toLocaleString()} o</span>}
        </p>
      )}
    </div>
  )
}
