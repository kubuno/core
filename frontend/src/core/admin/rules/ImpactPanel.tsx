// "Estimate the impact" — the retrospective replay, and its caveats.
//
// The server replays the event log through the SAME gates the live path runs, in
// backtest mode: nothing acts, nothing alerts, no threshold counter is written.
// What comes back is a report with numbers AND a `limitations` list, and this
// panel renders the two together on purpose.
//
// A replay cannot answer everything: the event log keeps structural fields only,
// scope and rollout are evaluated against TODAY's directory, a threshold is not
// replayed at all, and the log is purged at thirty days. Presenting the numbers
// without those sentences would turn an estimate into a measurement, and an
// operator would arm a rule on the strength of it.

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, BarChart3, History, Play } from 'lucide-react'
import { Button, Callout, ProgressBar, Spinner } from '@ui'
import { useBacktest, useStartBacktest } from './api'
import { formatWhen } from '../sections/format'
import { BACKTEST_MAX_WINDOW_DAYS, type BacktestRow } from './types'

interface Props {
  ruleId:   string | null
  /** The last replays already stored for this rule, newest first. */
  previous: BacktestRow[]
  /** No rule id yet (the wizard): the panel explains instead of offering. */
  hint?:    string
}

const WINDOWS = [1, 7, 14, 30]

function Figure({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface-0 px-3 py-2">
      <div className="tabular-nums text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>{value}</div>
      <div className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>{label}</div>
      {hint && <div className="mt-0.5 text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>{hint}</div>}
    </div>
  )
}

export default function ImpactPanel({ ruleId, previous, hint }: Props) {
  const { t, i18n } = useTranslation()
  const [days, setDays] = useState(7)
  const [runId, setRunId] = useState<string | null>(null)

  const start = useStartBacktest()
  const poll  = useBacktest(ruleId, runId)

  // Adopt the newest stored replay so re-opening the tab shows the last answer
  // rather than an empty panel with a button.
  useEffect(() => {
    if (!runId && previous.length > 0) setRunId(previous[0].id)
  }, [previous, runId])

  const row = poll.data ?? previous.find(b => b.id === runId) ?? null
  const report = row?.report ?? {}
  const running = row?.status === 'pending' || row?.status === 'running' || start.isPending

  const launch = () => {
    if (!ruleId) return
    const to = new Date()
    // One minute of margin. The server refuses a window starting before
    // `now - 30 days` rather than silently shortening it, and its `now` is a
    // round trip later than ours: an exact 30-day request would be refused for
    // the few seconds the request spent travelling.
    const from = new Date(to.getTime() - days * 86_400_000 + 60_000)
    start.mutate(
      { id: ruleId, from: from.toISOString(), to: to.toISOString() },
      { onSuccess: bt => setRunId(bt.id) },
    )
  }

  if (!ruleId) {
    return <Callout variant="info" title={t('admin.rl_impact_title')}>{hint ?? t('admin.rl_impact_needs_save')}</Callout>
  }

  const scanned = report.events_scanned ?? 0
  const matched = report.matched ?? 0
  const ratio = scanned > 0 ? (matched / scanned) * 100 : 0

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {WINDOWS.map(d => (
          <Button key={d} variant={days === d ? 'secondary' : 'ghost'} size="sm" onClick={() => setDays(d)}>
            {t('admin.rl_impact_days', { n: d })}
          </Button>
        ))}
        <Button variant="primary" size="sm" icon={<Play size={14} />} loading={running} onClick={launch}>
          {t('admin.rl_impact_run')}
        </Button>
      </div>

      <p className="mb-3 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.rl_impact_retention', { days: BACKTEST_MAX_WINDOW_DAYS })}
      </p>

      {start.isError && (
        <Callout variant="danger" title={t('admin.rl_impact_failed')}>
          {(start.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? ''}
        </Callout>
      )}

      {row && running && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 py-3 text-text-secondary">
          <Spinner size="sm" />
          <span style={{ fontSize: 'var(--kb-text-meta)' }}>{t('admin.rl_impact_running')}</span>
        </div>
      )}

      {row?.status === 'failed' && (
        <Callout variant="danger" title={t('admin.rl_impact_failed')}>{row.error ?? '—'}</Callout>
      )}

      {row?.status === 'done' && (
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-text-tertiary"
            style={{ fontSize: 'var(--kb-text-meta)' }}>
            <History size={13} aria-hidden />
            {t('admin.rl_impact_window', {
              from: formatWhen(row.window_from, i18n.language),
              to:   formatWhen(row.window_to, i18n.language),
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Figure label={t('admin.rl_impact_scanned')} value={scanned} />
            <Figure label={t('admin.rl_impact_matched')} value={matched} />
            <Figure label={t('admin.rl_impact_would_act')} value={report.would_act ?? 0}
              hint={t('admin.rl_impact_would_act_hint')} />
            <Figure label={t('admin.rl_impact_filtered')}
              value={(report.out_of_scope ?? 0) + (report.out_of_rollout ?? 0)}
              hint={t('admin.rl_impact_filtered_hint')} />
          </div>

          <div className="mt-3">
            <ProgressBar value={ratio} max={100} variant="primary" size="sm"
              label={t('admin.rl_impact_ratio')} showValue
              formatValue={v => `${v.toFixed(1)} %`} t={t} />
          </div>

          {(report.by_org_unit?.length ?? 0) > 0 && (
            <div className="mt-4 min-w-0">
              <h4 className="mb-1.5 text-text-primary">{t('admin.rl_impact_by_unit')}</h4>
              <div className="flex flex-col gap-1">
                {(report.by_org_unit ?? []).slice(0, 8).map(u => (
                  <div key={u.unit} className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-text-secondary"
                      style={{ fontSize: 'var(--kb-text-meta)' }}>{u.unit}</span>
                    <span className="tabular-nums text-text-primary"
                      style={{ fontSize: 'var(--kb-text-meta)' }}>{u.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(report.by_day?.length ?? 0) > 0 && (
            <div className="mt-4 min-w-0">
              <h4 className="mb-1.5 flex items-center gap-1.5 text-text-primary">
                <BarChart3 size={14} aria-hidden />{t('admin.rl_impact_by_day')}
              </h4>
              <div className="flex min-w-0 items-end gap-1 overflow-x-auto">
                {(report.by_day ?? []).map(d => {
                  const peak = Math.max(...(report.by_day ?? []).map(x => x.count), 1)
                  return (
                    <div key={d.day} className="flex w-8 shrink-0 flex-col items-center gap-1"
                      title={`${d.day} — ${d.count}`}>
                      <div className="w-full rounded-t bg-primary"
                        style={{ height: `${Math.max(3, (d.count / peak) * 56)}px` }} aria-hidden />
                      <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
                        {d.day.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* The report says what it cannot answer. It travels WITH the numbers. */}
          <div className="mt-4">
            <Callout variant="warning" icon={<AlertTriangle size={16} />}
              title={t('admin.rl_impact_limits_title')}>
              <ul className="ms-4 list-disc">
                {(report.limitations ?? []).map((l, i) => <li key={i}>{l}</li>)}
                {report.truncated && <li>{t('admin.rl_impact_truncated')}</li>}
              </ul>
            </Callout>
          </div>
        </div>
      )}

      {!row && !running && !start.isError && (
        <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.rl_impact_never_run')}
        </p>
      )}
    </div>
  )
}
