// The five modes of caution, stated.
//
// This is the screen's centre of gravity. The reference console presents "on /
// off / test" and leaves the operator to infer what each one actually does; the
// result is rules armed by people who believed they were dry-running. So every
// mode is listed with the four facts that distinguish it — does it evaluate,
// does it log, does it ACT, and what happens to the alerts it raises — and the
// one mode that acts says so in the strongest terms the page has.
//
// The fifth, `backtest`, is deliberately NOT selectable: it is not a state a
// rule sits in, it is the mode an execution row carries when it came from a
// retrospective replay. It is shown at the bottom as what it is, because an
// operator who meets it in the run log needs to know it is not a mode somebody
// chose.

import { useTranslation } from 'react-i18next'
import { AlertTriangle, Ban, Eye, FlaskConical, History, ShieldAlert } from 'lucide-react'
import { Badge, Radio } from '@ui'
import { MODE_FACTS, MODE_ORDER, modeLabel, modeVariant } from './labels'
import type { Mode } from './types'

const GLYPH: Record<Mode, typeof Eye> = {
  inactive: Ban,
  simulate: FlaskConical,
  monitor:  Eye,
  enforce:  ShieldAlert,
}

interface Props {
  value:    Mode
  onChange: (mode: Mode) => void
  /** Modes the catalogue says are settable. Anything else is not offered. */
  modes:    Mode[]
  /** `enforce` needs at least one action — the server refuses it otherwise. */
  hasActions: boolean
  disabled?: boolean
}

export default function ModePicker({ value, onChange, modes, hasActions, disabled }: Props) {
  const { t } = useTranslation()
  const offered = MODE_ORDER.filter(m => modes.includes(m))

  return (
    <div className="flex flex-col gap-2">
      {offered.map(mode => {
        const facts = MODE_FACTS[mode]
        const Glyph = GLYPH[mode]
        const blocked = mode === 'enforce' && !hasActions
        const selected = value === mode
        return (
          <label key={mode}
            className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors
              ${selected ? 'border-primary bg-primary-light' : 'border-border bg-surface-0 hover:bg-surface-1'}
              ${blocked || disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
            <Radio
              checked={selected}
              onChange={() => { if (!blocked && !disabled) onChange(mode) }}
              disabled={blocked || disabled}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Glyph size={15} className="shrink-0 text-text-secondary" aria-hidden />
                <span className="text-text-primary">{modeLabel(t, mode)}</span>
                <Badge variant={modeVariant(mode)} size="sm">
                  {t(facts.acts ? 'admin.rl_mode_tag_acts' : 'admin.rl_mode_tag_safe')}
                </Badge>
              </div>
              <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t(`admin.rl_mode_${mode}_desc`)}
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-text-tertiary"
                style={{ fontSize: 'var(--kb-text-micro)' }}>
                <li>{t(facts.evaluates ? 'admin.rl_fact_evaluates_yes' : 'admin.rl_fact_evaluates_no')}</li>
                <li>{t(facts.logs ? 'admin.rl_fact_logs_yes' : 'admin.rl_fact_logs_no')}</li>
                <li>{t(facts.acts ? 'admin.rl_fact_acts_yes' : 'admin.rl_fact_acts_no')}</li>
                <li>{t(`admin.rl_fact_alerts_${facts.alerts}`)}</li>
              </ul>
              {blocked && (
                <p className="mt-1.5 flex items-center gap-1.5 text-warning"
                  style={{ fontSize: 'var(--kb-text-micro)' }}>
                  <AlertTriangle size={12} aria-hidden />
                  {t('admin.rl_mode_enforce_needs_action')}
                </p>
              )}
            </div>
          </label>
        )
      })}

      {/* Not selectable, and that is the information. */}
      <div className="mt-1 flex items-start gap-3 rounded-lg border border-dashed border-border px-3 py-2.5">
        <History size={15} className="mt-0.5 shrink-0 text-text-tertiary" aria-hidden />
        <div className="min-w-0">
          <span className="text-text-secondary">{t('admin.rl_mode_backtest')}</span>
          <p className="mt-0.5 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.rl_mode_backtest_desc')}
          </p>
        </div>
      </div>
    </div>
  )
}
