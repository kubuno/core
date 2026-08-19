import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Info, Package, Plus, RotateCcw, SlidersHorizontal, Users, Wifi } from 'lucide-react'
import { Button, Callout, Dropdown, EmptyState, Spinner } from '@ui'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import { Slot } from '../../slots/SlotRegistry'
import { useAdminModules } from '../adminModules'
import PanelCard from '../panels/PanelCard'
import { reportUrl } from '../panels/report'
import { applyLayout, usePanelLayout } from '../panels/usePanelLayout'
import type { DashboardPanel } from '../panels/types'
import { useAdminStats } from './adminStats'
import { errorMessage, useDashboard, type DashboardRetention } from './dashboard/api'
import { DEFAULT_ORDER, panelDef } from './dashboard/panels'
import type { AdminSectionProps } from './registry'

/**
 * The instance dashboard — panels of counted facts, over a window the operator
 * chooses, arranged the way they want them.
 *
 * ## Built like its sibling, on purpose
 *
 * Period selector, percentage against the window of identical length before the
 * reading, "afficher le rapport" on every card, and a layout persisted in the
 * account's preferences: all of it is the machinery the security overview
 * already uses, shared rather than re-implemented (`../panels`, and
 * `handlers/admin/period.rs` on the server). Two dashboards in one console whose
 * "−12 %" meant two different things would be worse than having one.
 *
 * ## The four figures above the grid are not panels
 *
 * They answer "what is true right now" and never move with the period, which is
 * exactly why they are not in the customisable grid: a window selector floating
 * above a number that ignores it is the fastest way to make a page lie. They
 * come from `/admin/stats`, the same instantaneous read the landing page uses.
 *
 * ## What this page does NOT show
 *
 * File sharing exposure — how much is shared, internally and externally. It
 * lives in `drive`, in `photos`, in `office`: module schemas the core never
 * reads. The panel is absent rather than drawn as a zero, and the note at the
 * foot says so, because `0` on a sharing panel is read as "nothing is shared"
 * when it means "nobody measured".
 */

/** Where this page remembers its arrangement. Module-level, so the object it
 *  passes to the shared hook keeps one identity across renders. */
const LAYOUT_KEYS = {
  pref:         'dashboard_panels',
  cache:        'kubuno-admin-dashboard',
  defaultOrder: DEFAULT_ORDER,
}

/** Windows whose reach can be stated in days, for the retention notices. */
const PERIOD_DAYS: Record<string, number> = {
  last_180_days: 180, last_90_days: 90, last_30_days: 30, last_7_days: 7,
}

function StatCard({
  label, value, icon: Icon, tone, accent, children,
}: {
  label: string
  value: ReactNode
  icon: typeof Users
  /** A theme token, never a literal: this card is painted in both themes. */
  tone: string
  accent?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface-0 p-4">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <span className="min-w-0 truncate text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {label}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2">
          <Icon size={16} style={{ color: tone }} />
        </span>
      </div>
      <p className="font-semibold leading-tight text-text-primary tabular-nums"
         style={{ fontSize: 'var(--kb-text-title)' }}>
        {value}
      </p>
      {accent && (
        <div className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>{accent}</div>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

export default function DashboardSection({ navigate }: AdminSectionProps) {
  const { t, i18n } = useTranslation()
  const { can } = usePrivileges()
  const [period, setPeriod] = useState('last_30_days')
  const [editing, setEditing] = useState(false)

  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data, isLoading, isError, error } = useDashboard(period)
  const { layout, hide, show, move, reset } = usePanelLayout(LAYOUT_KEYS)
  // Only to spell module ids as the names an operator reads. Absent without
  // `core.modules.read`, in which case the ranking shows the ids themselves —
  // true, if plain.
  const { data: modules } = useAdminModules()

  const moduleName = useCallback(
    (id: string) => modules?.find(m => m.id === id)?.display_name ?? id,
    [modules],
  )

  // Only panels this build knows how to title AND the server actually sent. An
  // older console must never invent a heading for a newer server's panel.
  const received = useMemo(() => {
    const map = new Map<string, DashboardPanel>()
    for (const p of data?.panels ?? []) if (panelDef(p.id)) map.set(p.id, p)
    return map
  }, [data])

  const visible = useMemo(
    () => applyLayout([...received.keys()], layout),
    [received, layout],
  )

  /** In the catalogue, received from the server, but put away by the operator. */
  const hiddenAvailable = useMemo(
    () => [...received.keys()].filter(id => !visible.includes(id)),
    [received, visible],
  )

  const periodOptions = useMemo(
    () => (data?.periods ?? [period]).map(id => ({
      value: id, label: t(`admin.sec_period_${id}`, { defaultValue: id }),
    })),
    [data?.periods, period, t],
  )

  /**
   * The panel's own report — the printable document, over the window currently
   * on screen.
   *
   * It used to open the LIST the panel's records live in (the account list, the
   * session inventory), which is a different scope over a different period and
   * has never been printable. That list is still one click away, from the report
   * itself (`def.reportTab`); what "afficher le rapport" opens is now a report.
   */
  const openReport = useCallback((id: string) => {
    if (!panelDef(id)) return
    navigate(reportUrl('dashboard', id, period))
  }, [navigate, period])

  const n = (v?: number) => (statsLoading ? '…' : (v ?? 0).toLocaleString(i18n.language))
  const total = stats?.users_total ?? 0
  const activePct = total > 0 ? Math.round(((stats?.users_active ?? 0) / total) * 100) : 0
  const healthy = stats?.modules_by_status?.find(s => s.key === 'healthy')?.count ?? stats?.modules_active ?? 0
  const modTotal = (stats?.modules_by_status ?? []).reduce((s, x) => s + x.count, 0) || (stats?.modules_active ?? 0)

  if (!can(PRIV.STATS_READ)) {
    return (
      <EmptyState
        icon={<Info size={28} />}
        title={t('admin.dash_forbidden')}
        description={t('admin.dash_forbidden_desc')}
      />
    )
  }

  const bucket = data?.period.bucket ?? 'day'
  const withheldCount = data?.withheld.length ?? 0

  return (
    <div>
      {/* ── What is true right now, and never moves with the window ── */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('admin.card_users_total')} value={n(stats?.users_total)} icon={Users}
          tone="var(--kb-chart-1)"
          accent={t('admin.sub_new_week', { count: stats?.new_users_7d ?? 0 })}
        />
        <StatCard
          label={t('admin.card_users_active')} value={n(stats?.users_active)} icon={Users}
          tone="var(--kb-chart-2)"
          accent={t('admin.sub_of_total', { pct: activePct })}
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-success" style={{ width: `${activePct}%` }} />
          </div>
        </StatCard>
        <StatCard
          label={t('admin.card_users_online')} value={n(stats?.users_online)} icon={Wifi}
          tone="var(--kb-chart-6)"
          accent={t('admin.sub_n_sessions', { count: stats?.sessions_active ?? 0 })}
        />
        <StatCard
          label={t('admin.card_modules_active')} value={n(healthy)} icon={Package}
          tone="var(--kb-chart-5)"
          accent={t('admin.sub_healthy_total', { healthy, total: modTotal })}
        />
      </div>

      {/* ── The window, and the way to rearrange what it draws ── */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.dash_intro')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            value={period}
            onChange={setPeriod}
            options={periodOptions}
            width={200}
            focusable
          />
          <Button
            variant={editing ? 'primary' : 'secondary'}
            onClick={() => setEditing(v => !v)}
            icon={editing ? <Check size={15} /> : <SlidersHorizontal size={15} />}
          >
            {editing ? t('admin.sec_done') : t('admin.sec_customise')}
          </Button>
        </div>
      </div>

      {isError && (
        <Callout variant="danger" className="mb-4">
          {errorMessage(error, t('admin.stats_error'))}
        </Callout>
      )}

      {/* ── What the window can actually reach ── */}
      {data && <ReachNotice periodId={data.period.id} retention={data.retention} />}

      {isLoading && (
        <div className="flex justify-center py-16"><Spinner /></div>
      )}

      {/* ── The grid ── */}
      {data && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((id, i) => {
            const def = panelDef(id)
            const panel = received.get(id)
            if (!def || !panel) return null
            return (
              <PanelCard
                key={id}
                def={def}
                panel={panel}
                bucket={bucket}
                editing={editing}
                canMoveUp={i > 0}
                canMoveDown={i < visible.length - 1}
                onHide={() => hide(id, visible)}
                onMove={d => move(id, d, visible)}
                onReport={() => openReport(id)}
                labelSlice={id === 'app_usage' ? moduleName : undefined}
              />
            )
          })}
        </div>
      )}

      {data && visible.length === 0 && (
        <EmptyState
          icon={<SlidersHorizontal size={28} />}
          title={t('admin.sec_all_hidden')}
          description={t('admin.sec_all_hidden_desc')}
          action={{ label: t('admin.sec_reset'), onClick: reset, variant: 'secondary' }}
        />
      )}

      {/* ── Put back what was put away ── */}
      {editing && data && (
        <div className="mt-6 rounded-xl border border-border bg-surface-1 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-text-primary" style={{ fontSize: 'var(--kb-text-heading)' }}>
              {t('admin.sec_hidden_panels')}
            </h2>
            <Button variant="ghost" onClick={reset} icon={<RotateCcw size={14} />}>
              {t('admin.sec_reset')}
            </Button>
          </div>
          {hiddenAvailable.length === 0 ? (
            <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.sec_nothing_hidden')}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {hiddenAvailable.map(id => {
                const def = panelDef(id)
                if (!def) return null
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => show(id, visible)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-0
                                 px-2.5 py-1.5 text-text-secondary hover:bg-surface-2"
                      style={{ fontSize: 'var(--kb-text-body)' }}
                    >
                      <Plus size={14} aria-hidden />
                      {t(def.titleKey)}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* Panels this operator may not read: a discreet line, not a panel of its
          own. The essay about what the page cannot measure was removed — a
          dashboard is read for its figures, and a paragraph explaining an absent
          card was the longest text on the screen. */}
      {data && withheldCount > 0 && (
        <p className="mt-4 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.sec_withheld', { count: withheldCount })}
        </p>
      )}

      {/* ── What the modules add to this page ── */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Slot name="dashboard-stats-cards" />
      </div>
      <Slot name="dashboard-widgets" />
    </div>
  )
}

/**
 * Says when the chosen window reaches further back than a source can answer.
 *
 * Two ways that happens, and both mislead in the same direction. The counters
 * are purged past their retention, and they only started on the day the feature
 * shipped — either way the start of a long window is flat, and a flat start
 * reads as "nobody used anything" when it means "nothing was kept" or "nothing
 * was counted yet".
 */
function ReachNotice({
  periodId, retention,
}: {
  periodId:  string
  retention: DashboardRetention
}) {
  const { t, i18n } = useTranslation()
  const asked = PERIOD_DAYS[periodId] ?? 0

  if (asked > 0 && asked > retention.module_usage_days) {
    return (
      <Callout variant="info" className="mb-4">
        {t('admin.dash_retention_notice', { days: asked, kept: retention.module_usage_days })}
      </Callout>
    )
  }

  const since = retention.module_usage_since
  if (asked > 0 && since) {
    const started = new Date(`${since}T00:00:00`)
    const windowStart = new Date()
    windowStart.setDate(windowStart.getDate() - asked)
    if (!Number.isNaN(started.getTime()) && started > windowStart) {
      return (
        <Callout variant="info" className="mb-4">
          {t('admin.dash_usage_since_notice', {
            date: new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(started),
          })}
        </Callout>
      )
    }
  }

  return null
}
