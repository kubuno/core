import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Boxes, LineChart, Server, Sliders } from 'lucide-react'
import { Button, Callout, Card, EmptyState, ProgressBar, Spinner } from '@ui'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import { adminUrl } from '../adminAction'
import { formatBytes } from '../sections/format'
import type { AdminSectionProps } from '../sections/registry'
import { CompositionBar, Figure, TrendChart, type Segment } from './charts'
import ConsumersCard from './ConsumersCard'
import ModuleBreakdownCard from './ModuleBreakdownCard'
import QuotaPolicyCard from './QuotaPolicyCard'
import ReconciliationCard from './ReconciliationCard'
import { errorMessage, useSetWarnPercent, useStorageOverview } from './api'

/**
 * Storage — the capacity page.
 *
 * ## The three numbers, and why none of them is "the" number
 *
 *  * **Consumed** — what the accounts hold. The sum the modules maintain.
 *  * **Allocated** — the sum of the quotas: what has been *promised*. Routinely
 *    several times the disk, and legitimately so.
 *  * **The volume** — what the filesystem actually has. The only hard ceiling,
 *    and the only one whose exhaustion breaks the instance rather than one
 *    account.
 *
 * The page leads with consumption against the volume, because that is the
 * ceiling that fails, and keeps the other two beside it rather than folding them
 * into one reassuring bar.
 *
 * ## The split by module
 *
 * Still not derived from consumption — the core holds one figure per account
 * with no provenance, and slicing it into plausible parts would be a chart that
 * lies. It is assembled instead from what each module **declared about itself**,
 * which makes three states visible where there used to be one number: declared,
 * declared zero, and never declared. Whatever the declarations do not cover is
 * named on the card rather than folded into a module's slice.
 */
export default function StorageSection({ params, navigate }: AdminSectionProps) {
  const { t } = useTranslation()
  const { can } = usePrivileges()
  const canManageSettings = can(PRIV.SETTINGS_MANAGE)

  const { data, isLoading, isError, refetch } = useStorageOverview()
  const setWarn = useSetWarnPercent()
  const [warnDraft, setWarnDraft] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const trendData = useMemo(
    () => (data?.trend ?? []).map(p => ({ day: p.day, value: p.used_bytes })),
    [data],
  )

  /**
   * Growth read from the samples, and the exhaustion date it implies.
   *
   * Only computed from a week of measurements and only while growth is positive:
   * a projection drawn through two points is a straight line through noise, and
   * this is the number somebody would buy a disk on.
   */
  const projection = useMemo(() => {
    const pts = data?.trend ?? []
    if (pts.length < 7 || !data?.volume) return null
    const first = pts[0], last = pts[pts.length - 1]
    const days = Math.max(
      (new Date(last.day).getTime() - new Date(first.day).getTime()) / 86_400_000,
      1,
    )
    const perDay = (last.used_bytes - first.used_bytes) / days
    if (perDay <= 0) return { perDay, daysLeft: null as number | null }
    return { perDay, daysLeft: Math.round(data.volume.available_bytes / perDay) }
  }, [data])

  if (isLoading) {
    return <div className="py-16 flex justify-center"><Spinner /></div>
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<Server size={26} />}
        variant="error"
        title={t('admin.sto_load_failed')}
        description={t('admin.sto_load_failed_desc')}
        action={{ label: t('admin.sto_retry'), onClick: () => void refetch() }}
        t={t}
      />
    )
  }

  const { volume, quota_states: states } = data
  const volumeFreeRatio = volume && volume.total_bytes > 0
    ? volume.available_bytes / volume.total_bytes
    : null
  // Content on the volume that is not accounted for by any account quota: the
  // database, thumbnails, module working files. Never negative — a module that
  // over-reports would otherwise draw a segment backwards.
  const otherOnVolume = volume ? Math.max(volume.used_bytes - data.used_bytes, 0) : 0

  const volumeSegments: Segment[] = volume ? [
    { id: 'accounts', label: t('admin.sto_seg_accounts'), value: Math.min(data.used_bytes, volume.used_bytes), color: 'var(--color-primary)' },
    { id: 'other',    label: t('admin.sto_seg_other'),    value: otherOnVolume,            color: 'var(--color-border-strong)' },
    { id: 'free',     label: t('admin.sto_seg_free'),     value: volume.available_bytes,   color: 'var(--color-surface-2)', track: true },
  ] : []

  const stateSegments: Segment[] = [
    { id: 'ok',   label: t('admin.sto_state_ok'),   value: states.ok,   color: 'var(--color-success)' },
    { id: 'near', label: t('admin.sto_state_near'), value: states.near, color: 'var(--color-warning)' },
    { id: 'full', label: t('admin.sto_state_full'), value: states.full, color: 'var(--color-danger)' },
  ]

  const overCommitted = data.allocated_bytes > 0 && volume
    ? data.allocated_bytes > volume.total_bytes
    : false

  const saveWarn = async (percent: number) => {
    setError(null)
    try {
      await setWarn.mutateAsync(percent)
      setWarnDraft(null)
    } catch (e) {
      setError(errorMessage(e, t('admin.sto_threshold_failed')))
    }
  }

  return (
    <div className="min-w-0">
      <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
        {t('admin.sto_title')}
      </h1>
      <p className="mt-1 max-w-3xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {t('admin.sto_intro')}
      </p>

      {/* One banner, for the condition that actually stops the instance. An
          account that is full is one person's problem and lives in its own
          card; a volume that is full is everybody's. */}
      {volumeFreeRatio != null && volumeFreeRatio < 0.15 && (
        <Callout
          variant={volumeFreeRatio < 0.07 ? 'danger' : 'warning'}
          className="mt-4"
          title={t('admin.sto_banner_volume_title', { percent: Math.round(volumeFreeRatio * 100) })}
          action={{ label: t('admin.sto_banner_open_alerts'), onClick: () => navigate(adminUrl({ tab: 'alerts' })) }}
          t={t}
        >
          {t('admin.sto_banner_volume_desc')}
        </Callout>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Where it sits ─────────────────────────────────────────────── */}
        <Card title={t('admin.sto_overview_title')} icon={<Server size={16} />}>
          {/* The hero figure: one per view, in the same sans as everything
              else, proportional figures. */}
          <div className="flex items-baseline gap-2">
            <span className="text-text-primary" style={{ fontSize: '40px', lineHeight: 1.1, fontWeight: 600 }}>
              {formatBytes(data.used_bytes)}
            </span>
            {volume && (
              <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {t('admin.sto_of_volume', { total: formatBytes(volume.total_bytes) })}
              </span>
            )}
          </div>

          {volume ? (
            <div className="mt-4">
              <CompositionBar
                segments={volumeSegments}
                total={volume.total_bytes}
                ariaLabel={t('admin.sto_volume_aria')}
              />
              <p className="mt-3 truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {volume.path}
              </p>
            </div>
          ) : (
            <Callout variant="info" className="mt-4" t={t}>
              {t('admin.sto_volume_unknown')}
            </Callout>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <Figure label={t('admin.sto_fig_accounts')}>{data.accounts}</Figure>
            <Figure label={t('admin.sto_fig_allocated')}>{formatBytes(data.allocated_bytes)}</Figure>
          </div>

          {overCommitted && (
            <p className="mt-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.sto_overcommit', {
                allocated: formatBytes(data.allocated_bytes),
                total:     formatBytes(volume?.total_bytes ?? 0),
              })}
            </p>
          )}
        </Card>

        {/* ── How the accounts stand ────────────────────────────────────── */}
        <Card title={t('admin.sto_states_title')} icon={<Boxes size={16} />}
              subtitle={t('admin.sto_states_sub', { percent: data.warn_percent })}>
          <CompositionBar
            segments={stateSegments}
            total={Math.max(data.accounts, 1)}
            ariaLabel={t('admin.sto_states_aria')}
            format={n => String(n)}
          />

          {states.full === 0 && states.near === 0 ? (
            <p className="mt-4 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {t('admin.sto_states_all_clear')}
            </p>
          ) : (
            <div className="mt-4 flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden />
              <p className="min-w-0 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {t('admin.sto_states_attention', { count: states.full, near: states.near })}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Growth ───────────────────────────────────────────────────────── */}
      <div className="mt-4">
        <Card title={t('admin.sto_trend_title')} icon={<LineChart size={16} />}
              subtitle={t('admin.sto_trend_sub')}>
          {trendData.length >= 2 ? (
            <>
              <TrendChart data={trendData} label={t('admin.sto_trend_aria')} />
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
                <Figure label={t('admin.sto_fig_measured')}>
                  {t('admin.sto_fig_days', { count: trendData.length })}
                </Figure>
                <Figure label={t('admin.sto_fig_growth')}>
                  {formatBytes(Math.max(trendData[trendData.length - 1].value - trendData[0].value, 0))}
                </Figure>
                {projection && (
                  <Figure label={t('admin.sto_fig_forecast')}>
                    {projection.daysLeft != null
                      ? t('admin.sto_fig_days', { count: projection.daysLeft })
                      : t('admin.sto_fig_no_growth')}
                  </Figure>
                )}
              </div>
              {projection?.daysLeft != null && (
                <p className="mt-3 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.sto_forecast_caveat')}
                </p>
              )}
            </>
          ) : (
            <EmptyState
              icon={<LineChart size={26} />}
              variant="unavailable"
              compact
              title={t('admin.sto_trend_empty_title')}
              description={t('admin.sto_trend_empty_desc', { count: data.sampled_days })}
              t={t}
            />
          )}
        </Card>
      </div>

      {/* ── Where it came from ───────────────────────────────────────────── */}
      {/* Guarded: a frontend deployed ahead of its server (the frontend-only
          deploy path exists and is used) would otherwise crash the whole page
          on a field the older server does not send. */}
      {data.by_module && (
        <div className="mt-4">
          <ModuleBreakdownCard data={data.by_module} />
        </div>
      )}

      {/* ── Whether the counters can still be trusted ────────────────────── */}
      {/* Same guard as above: a frontend deployed ahead of its server must not
          take the whole page down over a block the older core does not send. */}
      {data.reconciliation && (
        <div className="mt-4">
          <ReconciliationCard
            data={data.reconciliation}
            modules={data.by_module?.modules ?? []}
            staleHours={data.by_module?.stale_hours ?? 0}
          />
        </div>
      )}

      {/* ── Who holds it ─────────────────────────────────────────────────── */}
      <div className="mt-4">
        <ConsumersCard
          warnPercent={data.warn_percent}
          initialFilter={params.get('filter') === 'full' ? 'full'
            : params.get('filter') === 'near' ? 'near' : 'all'}
        />
      </div>

      {/* ── Where it sits in the organisation ────────────────────────────── */}
      <div className="mt-4">
        <Card title={t('admin.sto_units_title')} subtitle={t('admin.sto_units_sub')}>
          {data.by_unit.length === 0 ? (
            <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {t('admin.sto_units_empty')}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.by_unit.map(u => (
                <li key={u.unit_id ?? 'none'}>
                  <ProgressBar
                    value={u.used_bytes}
                    max={Math.max(data.used_bytes, 1)}
                    variant="primary"
                    label={
                      <span>
                        {u.unit_name ?? t('admin.sto_no_unit')}
                        <span className="text-text-tertiary"> · {t('admin.sto_units_accounts', { count: u.accounts })}</span>
                      </span>
                    }
                    showValue
                    formatValue={() => formatBytes(u.used_bytes)}
                    t={t}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── The policy ───────────────────────────────────────────────────── */}
      <div className="mt-4">
        <QuotaPolicyCard overview={data} />
      </div>

      {/* ── The line between "fine" and "look at this" ───────────────────── */}
      <div className="mt-4">
        <Card title={t('admin.sto_threshold_title')} icon={<Sliders size={16} />}
              subtitle={t('admin.sto_threshold_sub')}>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              disabled={!canManageSettings}
              value={warnDraft ?? data.warn_percent}
              onChange={e => setWarnDraft(Number(e.target.value))}
              aria-label={t('admin.sto_threshold_title')}
              className="h-1 min-w-[180px] flex-1 accent-[var(--color-primary)]"
            />
            <span className="tabular-nums text-text-primary" style={{ fontSize: 'var(--kb-text-heading)' }}>
              {warnDraft ?? data.warn_percent} %
            </span>
            {canManageSettings && warnDraft != null && warnDraft !== data.warn_percent && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setWarnDraft(null)}>
                  {t('admin.sto_cancel')}
                </Button>
                <Button variant="primary" size="sm" disabled={setWarn.isPending}
                        onClick={() => void saveWarn(warnDraft)}>
                  {t('admin.sto_save')}
                </Button>
              </div>
            )}
          </div>
          {error && (
            <p className="mt-3 text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>
              {error}
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
