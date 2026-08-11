// The run log — what the engine actually did.
//
// ── What is deliberately not here ────────────────────────────────────────────
// There is no column for the content a rule inspected, because the engine never
// records it. An execution row keeps STRUCTURAL references — which account,
// which resource, which version of which rule, how many actions ran and how they
// ended — and nothing about the values that were compared. Adding a column for
// them would require inventing data, and a log that invents is worse than no log.
//
// ── Simulation must be unmistakable ──────────────────────────────────────────
// A simulated run and an enforcing run produce rows that look identical unless
// the console makes them differ. They do not mean the same thing at all — one
// suspended somebody, the other imagined it — so simulated rows carry their own
// badge and a tinted mode cell.
//
// The table is hand-rolled rather than a DataTable because a row here EXPANDS:
// the per-action verdicts are the answer to "why is this account locked out",
// and burying them behind a second navigation is how that question goes
// unanswered.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, FlaskConical, RefreshCw, ScrollText } from 'lucide-react'
import { Badge, Button, Combobox, EmptyState, Spinner, useIsMobile } from '@ui'
import { useExecutions, useRules } from './api'
import {
  actionStatusLabel, actionStatusVariant, isSimulated, modeLabel, modeVariant,
  outcomeLabel, outcomeVariant, severityLabel, severityVariant, windowLabel,
} from './labels'
import { formatWhen } from '../sections/format'
import type { ExecutionRow, Outcome } from './types'

const OUTCOMES: Outcome[] = [
  'acted', 'matched', 'no_match', 'out_of_scope', 'out_of_rollout',
  'below_threshold', 'depth_exceeded', 'error',
]

interface Props {
  /** Pre-filter on one rule (the rule sheet's own log). */
  ruleId?: string | null
  /** Hide the page header — the section already painted one. */
  embedded?: boolean
}

function Detail({ row, ruleSeverity }: { row: ExecutionRow; ruleSeverity: string | undefined }) {
  const { t } = useTranslation()
  const d = row.detail ?? {}
  const verdicts = d.actions ?? []

  return (
    <div className="flex min-w-0 flex-col gap-3 bg-surface-1 px-4 py-3">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-text-secondary"
        style={{ fontSize: 'var(--kb-text-meta)' }}>
        <span>{t('admin.rl_log_event', { type: row.event_type })}</span>
        <span>{t('admin.rl_log_version', { n: row.rule_version })}</span>
        <span>{t('admin.rl_log_duration', { ms: row.duration_ms })}</span>
        <span>{t('admin.rl_log_depth', { n: row.depth })}</span>
        {d.leaves_evaluated !== undefined && <span>{t('admin.rl_log_leaves', { count: d.leaves_evaluated })}</span>}
        {d.scope_applied !== undefined && (
          <span>{t(d.scope_applied ? 'admin.rl_log_scope_yes' : 'admin.rl_log_scope_no')}</span>
        )}
        {d.rollout_percent !== undefined && d.rollout_percent < 100 && (
          <span>{t('admin.rl_log_rollout', { percent: d.rollout_percent })}</span>
        )}
        {ruleSeverity && (
          <span>
            {t('admin.rl_log_severity')} <Badge variant={severityVariant(ruleSeverity)} size="sm">
              {severityLabel(t, ruleSeverity)}
            </Badge>
          </span>
        )}
      </div>

      {d.threshold && (
        <div className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.rl_log_threshold', {
            count: d.threshold.hits, needed: d.threshold.needed,
            window: windowLabel(t, d.threshold.window_s),
          })}
        </div>
      )}

      <div className="min-w-0">
        <h4 className="mb-1 text-text-primary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.rl_log_actions', {
            total: row.actions_total, count: row.actions_ok, failed: row.actions_failed,
          })}
        </h4>
        {verdicts.length === 0 ? (
          <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {row.actions_total === 0 ? t('admin.rl_log_no_action') : t('admin.rl_log_no_verdict')}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {verdicts.map((v, i) => (
              <li key={i} className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-mono text-text-primary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {v.action}
                </span>
                <Badge variant={actionStatusVariant(v.status)} size="sm">
                  {actionStatusLabel(t, v.status)}
                </Badge>
                {v.error && (
                  <span className="min-w-0 truncate text-danger" style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {v.error}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {(row.resource_type || row.actor_user_id) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-text-tertiary"
          style={{ fontSize: 'var(--kb-text-micro)' }}>
          {row.actor_user_id && <span className="font-mono">{t('admin.rl_log_actor_id', { id: row.actor_user_id })}</span>}
          {row.resource_type && (
            <span className="font-mono">{row.resource_type}: {row.resource_id ?? '—'}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function ExecutionsPanel({ ruleId, embedded }: Props) {
  const { t, i18n } = useTranslation()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState('')
  const [outcome, setOutcome] = useState('')
  const [rule, setRule] = useState(ruleId ?? '')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const rules = useRules()
  const { data, isLoading, isFetching, refetch } = useExecutions({
    rule_id: rule || undefined,
    mode: mode || undefined,
    outcome: outcome || undefined,
    limit: 200,
  })

  const severityOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of rules.data?.rules ?? []) m.set(r.id, r.severity)
    return m
  }, [rules.data])

  const rows = data ?? []

  const toggle = (id: number) => setExpanded(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const filters = (
    <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
      {!ruleId && (
        <Combobox
          value={rule || ''}
          onChange={setRule}
          options={[
            { value: '', label: t('admin.rl_log_all_rules') },
            ...(rules.data?.rules ?? []).map(r => ({ value: r.id, label: r.name })),
          ]}
          width={220}
          aria-label={t('admin.rl_log_all_rules')}
        />
      )}
      <Combobox
        value={mode}
        onChange={setMode}
        options={[
          { value: '', label: t('admin.rl_log_all_modes') },
          ...(['simulate', 'monitor', 'enforce', 'backtest'] as const)
            .map(m => ({ value: m, label: modeLabel(t, m) })),
        ]}
        width={190}
        aria-label={t('admin.rl_log_all_modes')}
      />
      <Combobox
        value={outcome}
        onChange={setOutcome}
        options={[
          { value: '', label: t('admin.rl_log_all_outcomes') },
          ...OUTCOMES.map(o => ({ value: o, label: outcomeLabel(t, o) })),
        ]}
        width={200}
        aria-label={t('admin.rl_log_all_outcomes')}
      />
      <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} loading={isFetching}
        onClick={() => void refetch()}>
        {t('admin.rl_log_refresh')}
      </Button>
    </div>
  )

  const body = () => {
    if (isLoading) return <div className="py-10 text-center"><Spinner /></div>
    if (rows.length === 0) {
      return (
        <EmptyState
          icon={<ScrollText size={26} />}
          variant={mode || outcome || rule ? 'no-results' : 'first-use'}
          title={t('admin.rl_log_empty_title')}
          description={t('admin.rl_log_empty_desc')}
        />
      )
    }

    if (isMobile) {
      // A phone gets cards: the row's identity is the rule and the outcome, the
      // rest lives behind the same expansion.
      return (
        <div className="flex flex-col gap-2">
          {rows.map(r => (
            <div key={r.id} className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface-0">
              <button type="button" onClick={() => toggle(r.id)}
                className="flex w-full min-w-0 flex-col gap-1 px-3 py-2 text-start hover:bg-surface-1">
                <span className="flex min-w-0 items-center gap-2">
                  {expanded.has(r.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="min-w-0 truncate text-text-primary">{r.rule_name ?? '—'}</span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={modeVariant(r.mode)} size="sm">
                    {isSimulated(r.mode) && <FlaskConical size={10} />}{modeLabel(t, r.mode)}
                  </Badge>
                  <Badge variant={outcomeVariant(r.outcome)} size="sm">{outcomeLabel(t, r.outcome)}</Badge>
                  <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
                    {formatWhen(r.occurred_at, i18n.language)}
                  </span>
                </span>
              </button>
              {expanded.has(r.id) && <Detail row={r} ruleSeverity={severityOf.get(r.rule_id)} />}
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="min-w-0 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[56rem] border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-1 text-start text-text-secondary">
              <th className="w-8" />
              <th className="px-3 py-2 text-start font-medium">{t('admin.rl_log_col_when')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('admin.rl_log_col_rule')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('admin.rl_log_col_mode')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('admin.rl_log_col_outcome')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('admin.rl_log_col_actor')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('admin.rl_log_col_resource')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('admin.rl_log_col_severity')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const open = expanded.has(r.id)
              const sim = isSimulated(r.mode)
              const severity = severityOf.get(r.rule_id)
              return [
                <tr key={r.id}
                  className={`cursor-pointer border-b border-border hover:bg-surface-1 ${sim ? 'bg-surface-1' : ''}`}
                  onClick={() => toggle(r.id)}>
                  <td className="ps-2 text-text-tertiary">
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-text-secondary">
                    {formatWhen(r.occurred_at, i18n.language)}
                  </td>
                  <td className="max-w-[16rem] truncate px-3 py-2 text-text-primary">{r.rule_name ?? '—'}</td>
                  <td className="px-3 py-2">
                    <Badge variant={modeVariant(r.mode)} size="sm">
                      {sim && <FlaskConical size={10} />}{modeLabel(t, r.mode)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={outcomeVariant(r.outcome)} size="sm">{outcomeLabel(t, r.outcome)}</Badge>
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-2 font-mono text-text-secondary"
                    style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {r.actor_user_id ?? '—'}
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-2 text-text-secondary"
                    style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {r.resource_type ? `${r.resource_type}: ${r.resource_id ?? '—'}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {severity
                      ? <Badge variant={severityVariant(severity)} size="sm">{severityLabel(t, severity)}</Badge>
                      : <span className="text-text-tertiary">—</span>}
                  </td>
                </tr>,
                open && (
                  <tr key={`${r.id}-detail`} className="border-b border-border">
                    <td colSpan={8} className="p-0">
                      <Detail row={r} ruleSeverity={severity} />
                    </td>
                  </tr>
                ),
              ]
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      {!embedded && (
        <h1 className="mb-4 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_rules_log')}
        </h1>
      )}
      <p className="mb-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.rl_log_intro')}
      </p>
      {filters}
      {body()}
    </div>
  )
}
