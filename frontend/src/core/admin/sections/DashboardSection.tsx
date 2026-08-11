import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity, BarChart2, HardDrive, MonitorSmartphone, Package, ShieldCheck, TrendingUp, UserPlus, Users, Wifi,
} from 'lucide-react'
import { Slot } from '../../slots/SlotRegistry'
import {
  AreaChart, BarChart, CHART_COLORS, DonutChart, HBarList, ProgressRing, Sparkline, fmtBytes,
} from '../DashboardCharts'
import { useAdminStats } from './adminStats'

const dayLabel = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '')

function StatCard({
  label, value, icon: Icon, color, accent, children,
}: {
  label: string; value: ReactNode; icon: typeof Users; color: string; accent?: ReactNode; children?: ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-col">
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a` }}>
          <Icon size={16} style={{ color }} />
        </span>
      </div>
      <p className="text-2xl font-semibold text-text-primary leading-tight">{value}</p>
      {accent && <div className="text-sm text-text-tertiary mt-1">{accent}</div>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

function ChartCard({ title, icon: Icon, children, className = '' }: { title: string; icon?: typeof Users; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-border p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={15} className="text-text-tertiary" />}
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function DashboardSection() {
  const { t } = useTranslation()
  const { data: stats, isError, error, isLoading } = useAdminStats()

  const n = (v?: number) => (isLoading ? '…' : (v ?? 0).toLocaleString())
  const total = stats?.users_total ?? 0
  const activePct = total > 0 ? Math.round(((stats?.users_active ?? 0) / total) * 100) : 0
  const storageUsed = stats?.storage_used ?? 0
  const storageQuota = stats?.storage_quota_total ?? 0
  const storagePct = storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0
  const healthy = stats?.modules_by_status?.find((s) => s.key === 'healthy')?.count ?? stats?.modules_active ?? 0
  const modTotal = (stats?.modules_by_status ?? []).reduce((s, x) => s + x.count, 0) || (stats?.modules_active ?? 0)

  const roleLabel = (k: string) => t(`admin.role_${k}`, { defaultValue: k })
  const devLabel = (k: string) => t(`admin.device_${k}`, { defaultValue: k })
  const statusLabel = (k: string) => t(`admin.status_${k}`, { defaultValue: k })

  const roleData = (stats?.users_by_role ?? []).map((r, i) => ({ label: roleLabel(r.key), value: r.count, color: CHART_COLORS[i % CHART_COLORS.length] }))
  const devData = (stats?.sessions_by_device ?? []).map((r, i) => ({ label: devLabel(r.key), value: r.count, color: CHART_COLORS[i % CHART_COLORS.length] }))
  const STATUS_COLOR: Record<string, string> = { healthy: '#1e8e3e', degraded: '#f9ab00', starting: '#1a73e8', stopped: '#d93025' }
  const statusData = (stats?.modules_by_status ?? []).map((r, i) => ({ label: statusLabel(r.key), value: r.count, color: STATUS_COLOR[r.key] ?? CHART_COLORS[i % CHART_COLORS.length] }))
  const signups = (stats?.signups_daily ?? []).map((d) => ({ label: dayLabel(d.date), value: d.count }))
  const logins = (stats?.logins_daily ?? []).map((d) => ({ label: dayLabel(d.date), value: d.count }))
  const events = (stats?.events_daily ?? []).map((d) => ({ label: dayLabel(d.date), value: d.count }))
  const topStorage = (stats?.top_storage ?? []).filter((u) => u.used > 0).map((u) => ({
    label: u.name, value: u.used, max: u.quota, sub: `${fmtBytes(u.used)} / ${fmtBytes(u.quota)}`,
  }))

  return (
    <div>
      {isError && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
          {t('admin.stats_error')}{' '}
          {(error as { message?: string })?.message ?? t('admin.check_logs')}
        </div>
      )}

      {/* ── Enriched statistic cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          label={t('admin.card_users_total')} value={n(stats?.users_total)} icon={Users} color="#1a73e8"
          accent={<span className="inline-flex items-center gap-1 text-success"><TrendingUp size={12} />{t('admin.sub_new_week', { count: stats?.new_users_7d ?? 0 })}</span>}
        >
          {signups.length > 0 && <Sparkline data={signups.map((s) => s.value)} color="#1a73e8" width={120} />}
        </StatCard>

        <StatCard
          label={t('admin.card_users_active')} value={n(stats?.users_active)} icon={UserPlus} color="#1e8e3e"
          accent={t('admin.sub_of_total', { pct: activePct })}
        >
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full bg-success" style={{ width: `${activePct}%` }} />
          </div>
        </StatCard>

        <StatCard
          label={t('admin.card_users_online')} value={n(stats?.users_online)} icon={Wifi} color="#0b8043"
          accent={t('admin.sub_n_sessions', { count: stats?.sessions_active ?? 0 })}
        />

        <StatCard
          label={t('admin.card_modules_active')} value={n(healthy)} icon={Package} color="#9c27b0"
          accent={t('admin.sub_healthy_total', { healthy, total: modTotal })}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title={t('admin.chart_signups')} icon={UserPlus} className="lg:col-span-2">
          {signups.length > 0 ? <BarChart data={signups} color="#1a73e8" /> : <p className="text-sm text-text-tertiary py-8 text-center">{t('admin.no_data')}</p>}
        </ChartCard>

        <ChartCard title={t('admin.chart_storage')} icon={HardDrive}>
          <ProgressRing
            pct={storagePct}
            value={`${Math.round(storagePct)}%`}
            label={t('admin.card_storage_used')}
            color={storagePct >= 90 ? '#d93025' : '#1a73e8'}
            sub={`${fmtBytes(storageUsed)} / ${fmtBytes(storageQuota)}`}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title={t('admin.chart_logins')} icon={Activity} className="lg:col-span-2">
          {logins.length > 0 ? <AreaChart data={logins} color="#1e8e3e" /> : <p className="text-sm text-text-tertiary py-8 text-center">{t('admin.no_data')}</p>}
        </ChartCard>

        <ChartCard title={t('admin.chart_roles')} icon={ShieldCheck}>
          {roleData.length > 0 ? <DonutChart data={roleData} centerValue={String(total)} centerLabel={t('admin.users_label')} /> : <p className="text-sm text-text-tertiary py-8 text-center">{t('admin.no_data')}</p>}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <ChartCard title={t('admin.chart_devices')} icon={MonitorSmartphone}>
          {devData.length > 0 ? <DonutChart data={devData} size={130} /> : <p className="text-sm text-text-tertiary py-8 text-center">{t('admin.no_data')}</p>}
        </ChartCard>

        <ChartCard title={t('admin.chart_modules')} icon={Package}>
          {statusData.length > 0 ? <DonutChart data={statusData} size={130} /> : <p className="text-sm text-text-tertiary py-8 text-center">{t('admin.no_data')}</p>}
        </ChartCard>

        <ChartCard title={t('admin.chart_top_storage')} icon={HardDrive}>
          {topStorage.length > 0 ? <HBarList items={topStorage} /> : <p className="text-sm text-text-tertiary py-8 text-center">{t('admin.no_data')}</p>}
        </ChartCard>
      </div>

      {events.some((e) => e.value > 0) && (
        <div className="mb-8">
          <ChartCard title={t('admin.chart_activity')} icon={BarChart2}>
            <BarChart data={events} color="#9c27b0" height={100} />
          </ChartCard>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Slot name="dashboard-stats-cards" />
      </div>
      <Slot name="dashboard-widgets" />
    </div>
  )
}
