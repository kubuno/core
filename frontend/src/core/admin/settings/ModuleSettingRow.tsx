// One row of a module's instance-settings panel: what the setting is on the
// left, the control that changes it on the right.
//
// Split out of `ModuleAdminSettings` because the row is where the declarative
// schema is actually honoured — bounds, units, list fields, risk — and that is
// more than a panel should carry inline.
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
  onChange: (v: unknown) => void
}

function Control({ item, value, invalid, onChange }: ControlProps) {
  const { t } = useTranslation()
  const placeholder = item.placeholder ?? undefined

  if (item.type === 'bool') {
    return <Toggle checked={!!value} onChange={() => onChange(!value)} />
  }

  if (item.type === 'enum') {
    return (
      <div className="flex flex-col items-start gap-2">
        {normOptions(item.values).map(opt => (
          <Radio key={String(opt.value)} checked={String(value) === String(opt.value)}
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
  onChange: (v: unknown) => void
  onReset:  () => void
}

export default function ModuleSettingRow({
  item, value, modified, pending, invalid, onChange, onReset,
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
  return (
    <div className="flex items-start gap-8 py-4 border-t border-border">
      <div className="w-72 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-text-primary">{item.label ?? item.key}</p>
          {item.risk && <RiskPill risk={item.risk} />}
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
          <p className="mt-0.5 leading-relaxed text-text-tertiary"
            style={{ fontSize: 'var(--kb-text-meta)' }}>{item.description}</p>
        )}
        {item.scope === 'overridable' && (
          <p className="mt-1 text-primary" style={{ fontSize: 'var(--kb-text-micro)' }}>
            {t('admin.m_overridable')}
          </p>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Control item={item} value={value} invalid={invalid} onChange={onChange} />
        {modified && (
          // `block`: a Toggle is inline, so without it the reset link lands on
          // the same line and reads as the switch's own label.
          <button
            type="button"
            onClick={onReset}
            className="mt-1.5 block text-left text-text-tertiary hover:text-primary transition-colors"
            style={{ fontSize: 'var(--kb-text-micro)' }}
          >
            {t('admin.m_reset_default_named', {
              value: describeDefault(),
              defaultValue: `Rétablir la valeur par défaut : ${describeDefault()}`,
            })}
          </button>
        )}
      </div>
    </div>
  )
}
