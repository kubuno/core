// One row of a module's instance-settings panel: the setting, and the control
// that changes it.
//
// Split out of `ModuleAdminSettings` because the row is where the declarative
// schema is actually honoured — bounds, units, list fields, risk — and that is
// more than a panel should carry inline.
//
// ── Why a switch reads left-to-right and a field top-to-bottom ───────────────
// A checkbox or a switch IS its label: "☑ Autoriser le partage externe" is one
// sentence, and splitting it across a row — box on one side, words on the other
// — makes the reader re-pair them by eye on every line. So a boolean puts the
// control first and the label beside it, description under the label and
// indented onto it, the way a form does.
//
// Everything else (a number, a text field, a group of radio options) is a
// question followed by an answer: the label states the question, the control
// sits under it, flush left. Pushing those to a right-hand column bought nothing
// and cost the label half the width it needed.
//
// ── Metrics ──────────────────────────────────────────────────────────────────
// The row is deliberately airy and hairline-separated rather than boxed: a
// settings list reads as one surface cut by 1px rules, not as a stack of tiles.
// Label 14px regular, description under it in the secondary grey. The row spans
// the full width of the settings column at every breakpoint — the section's own
// caption gutter is what makes the two-column reading, not the row.
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Input, Radio, Textarea, Toggle } from '@ui'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { countEntries, normOptions, type Risk, type SettingItem } from './moduleSettingSchema'

/** Same colour discipline as `Callout`: tinted surface + accent glyph only. */
const RISK_SKIN: Record<Risk, { box: string; icon: string }> = {
  info:    { box: 'bg-primary-light', icon: 'text-primary' },
  warning: { box: 'bg-warning-light', icon: 'text-warning' },
  danger:  { box: 'bg-danger-light',  icon: 'text-danger'  },
}

function RiskPill({ risk }: { risk: Risk }) {
  const { t } = useTranslation()
  // `info` earns no pill: a badge that never means "be careful" trains the eye
  // to skip every badge, including the two that matter.
  if (risk === 'info') return null
  const skin = RISK_SKIN[risk]
  const Glyph = risk === 'danger' ? AlertCircle : AlertTriangle
  const text = risk === 'danger'
    ? t('admin.m_risk_danger', { defaultValue: 'Sensible' })
    : t('admin.m_risk_warning', { defaultValue: 'Prudence' })
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${skin.box} text-text-primary`}
      style={{ fontSize: 'var(--kb-text-micro)' }}
      title={risk === 'danger'
        ? t('admin.m_risk_danger_hint', { defaultValue: 'Une mauvaise valeur peut rendre le service injoignable ou faire perdre des messages.' })
        : t('admin.m_risk_warning_hint', { defaultValue: 'Réglage à modifier en connaissance de cause.' })}
    >
      <Glyph size={11} className={skin.icon} />
      {text}
    </span>
  )
}

interface ControlProps {
  item:     SettingItem
  value:    unknown
  invalid:  boolean
  readOnly: boolean
  onChange: (v: unknown) => void
}

function Control({ item, value, invalid, readOnly, onChange }: ControlProps) {
  const { t } = useTranslation()
  const placeholder = item.placeholder ?? undefined

  if (item.type === 'bool') {
    return <Toggle checked={!!value} disabled={readOnly} onChange={() => onChange(!value)} />
  }

  if (item.type === 'enum') {
    return (
      <div className="flex flex-col items-start gap-2">
        {normOptions(item.values).map(opt => (
          <Radio key={String(opt.value)} checked={String(value) === String(opt.value)}
            disabled={readOnly}
            onChange={() => onChange(opt.value)} label={opt.label} />
        ))}
      </div>
    )
  }

  // A list setting (one entry per line): the count is what tells an
  // administrator the paste landed whole, without counting lines by eye.
  if (item.type === 'string' && item.multiline) {
    const entries = countEntries(value)
    return (
      <div className="max-w-lg">
        <Textarea
          value={value === null || value === undefined ? '' : String(value)}
          disabled={readOnly}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-28 font-mono"
        />
        <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
          {t('admin.m_entries_count', {
            count: entries,
            defaultValue: `${entries} entrée(s) — une par ligne`,
          })}
        </p>
      </div>
    )
  }

  if (item.type === 'int') {
    const bounds = [
      item.min !== null && item.min !== undefined ? `≥ ${item.min}` : null,
      item.max !== null && item.max !== undefined ? `≤ ${item.max}` : null,
    ].filter(Boolean).join(' · ')
    return (
      <div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={item.min ?? undefined}
            max={item.max ?? undefined}
            disabled={readOnly}
            value={value === null || value === undefined ? '' : String(value)}
            onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={placeholder}
            className={`max-w-40 ${invalid ? 'border-danger focus:ring-danger' : ''}`}
          />
          {item.unit && (
            <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {item.unit}
            </span>
          )}
        </div>
        {invalid ? (
          <p className="mt-1 text-danger" style={{ fontSize: 'var(--kb-text-micro)' }}>
            {t('admin.m_out_of_range', {
              defaultValue: `Valeur attendue : un entier ${bounds || 'valide'}`,
            })}
          </p>
        ) : bounds ? (
          <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
            {bounds}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        disabled={readOnly}
        value={value === null || value === undefined ? '' : String(value)}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="max-w-xs"
      />
      {item.unit && (
        <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {item.unit}
        </span>
      )}
    </div>
  )
}

export interface ModuleSettingRowProps {
  item:     SettingItem
  value:    unknown
  /** Differs from the factory default. */
  modified: boolean
  /** Edited in this session and not saved yet. */
  pending:  boolean
  invalid:  boolean
  /** A level above pinned this value, or the caller may not write here. */
  readOnly?: boolean
  /**
   * Offer "back to the factory value".
   *
   * False on a unit, where it would be a trap: staging the factory value there
   * and saving does not clear the unit's row, it WRITES the factory value into
   * it — the unit stops following its parent while looking as if it had been
   * put back. On a unit the honest action is "hériter", which the panel renders
   * under the provenance sentence instead.
   */
  showFactoryReset?: boolean
  /**
   * The at-a-glance state of the value beside the label — inherited, overridden
   * here, locked. Passed in rather than derived: the row knows the module's
   * declaration, only the panel knows which scope is on screen.
   */
  statusPill?: ReactNode
  /** The provenance sentence under the control, with its revert/lock actions. */
  provenance?: ReactNode
  onChange: (v: unknown) => void
  onReset:  () => void
}

export default function ModuleSettingRow({
  item, value, modified, pending, invalid,
  readOnly = false, showFactoryReset = true, statusPill, provenance, onChange, onReset,
}: ModuleSettingRowProps) {
  const { t } = useTranslation()
  // `String(default)` leaks the JSON: an empty default rendered as "()" and a
  // boolean as "(false)", neither of which is what the control shows.
  const describeDefault = (): string => {
    if (item.type === 'bool') {
      return item.default
        ? t('common.enabled', { defaultValue: 'activé' })
        : t('common.disabled', { defaultValue: 'désactivé' })
    }
    if (item.type === 'enum') {
      const opt = normOptions(item.values).find(o => String(o.value) === String(item.default))
      if (opt) return opt.label
    }
    const raw = item.default === null || item.default === undefined ? '' : String(item.default)
    return raw.trim() === '' ? t('common.empty', { defaultValue: 'vide' }) : raw
  }
  // A boolean is read as one sentence: the switch first, the words beside it.
  const inline = item.type === 'bool'

  /** The label line and its description — the sentence, wherever it is put. */
  const caption = (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {item.label ?? item.key}
        </p>
        {item.risk && <RiskPill risk={item.risk} />}
        {statusPill}
        {/* Knowing at a glance what still holds its factory value is what
            makes a long panel auditable. */}
        {modified && (
          <span className="text-primary" style={{ fontSize: 'var(--kb-text-micro)' }}>
            {pending
              ? t('admin.m_pending', { defaultValue: 'non enregistré' })
              : t('admin.m_modified', { defaultValue: 'modifié' })}
          </span>
        )}
      </div>
      {item.description && (
        <p className="mt-1 leading-relaxed text-text-secondary"
          style={{ fontSize: 'var(--kb-text-meta)' }}>{item.description}</p>
      )}
    </>
  )

  /** What hangs under the setting once it has been touched: reset, provenance. */
  const trailer = (
    <>
      {modified && !readOnly && showFactoryReset && (
        // `block`: the controls it follows are inline-level, so without it the
        // link lands on their line and reads as one of their labels.
        <button
          type="button"
          onClick={onReset}
          className="mt-1.5 block text-left text-text-tertiary transition-colors hover:text-primary"
          style={{ fontSize: 'var(--kb-text-micro)' }}
        >
          {t('admin.m_reset_default_named', {
            value: describeDefault(),
            defaultValue: `Rétablir la valeur par défaut : ${describeDefault()}`,
          })}
        </button>
      )}
      {provenance}
    </>
  )

  const control = (
    <Control item={item} value={value} invalid={invalid} readOnly={readOnly} onChange={onChange} />
  )

  return (
    <div
      // No opacity on a theme colour: a token can be remapped to anything by a
      // skin, and `bg-primary-light/30` over a dark surface is a muddy band
      // rather than a highlight. The plain step-1 surface says "this row is not
      // like its neighbours" in both themes at once.
      className={`border-t border-border px-5 py-4 ${pending ? 'bg-surface-1' : ''}`}
    >
      {inline ? (
        // `items-start`, and no vertical nudge: the switch is 20px tall and so
        // is a line of 14px body text, so they share a baseline box already.
        <div className="flex items-start gap-3">
          <div className="shrink-0">{control}</div>
          {/* The description sits in this column, which is what indents it onto
              the label rather than under the switch. */}
          <div className="min-w-0 flex-1">
            {caption}
            {trailer}
          </div>
        </div>
      ) : (
        <>
          {caption}
          <div className="mt-2 min-w-0">
            {control}
            {trailer}
          </div>
        </>
      )}
    </div>
  )
}
