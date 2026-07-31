import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Slot } from '../slots/SlotRegistry'
import { useSidebarStore } from '../store/sidebarStore'
import { useToolbarStore } from '../store/toolbarStore'
import { useSearchStore } from '../store/searchStore'
import UsersPanel from './UsersPanel'
import GroupsPanel from './GroupsPanel'
import ModulesPanel from './ModulesPanel'
import SettingsPanel from './SettingsPanel'
import ThemesPanel from './ThemesPanel'
import SpeechToTextPanel from './SpeechToTextPanel'
import OAuthProvidersPanel from './OAuthProvidersPanel'
import LoginAnimationPanel from './LoginAnimationPanel'
import MarketplacePanel from './MarketplacePanel'
import AdminRolesPanel from './AdminRolesPanel'
import OrgUnitsPanel from './OrgUnitsPanel'
import { useAuthStore } from '../store/authStore'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { User, OrgUnit } from '../types'
import {
  Users, Package, BarChart2, ShieldCheck, MonitorSmartphone, Wifi, HardDrive, UserPlus,
  Activity, TrendingUp, Home, LayoutDashboard, Contact, LayoutGrid, Shield, AtSign,
  CreditCard, BarChart3, Workflow, Cloud, ChevronRight, ChevronDown, Clock, Search, X,
  Bell, Plus, Building2, type LucideIcon,
} from 'lucide-react'
import {
  CHART_COLORS, fmtBytes, ProgressRing, DonutChart, BarChart, AreaChart, HBarList, Sparkline,
} from './DashboardCharts'

// A "tab" is the id of a navigable leaf in ADMIN_NAV (see below). '/admin' with
// no ?tab renders the home landing.

interface KV { key: string; count: number }
interface Series { date: string; count: number }
interface TopStorage { name: string; used: number; quota: number }
interface Stats {
  users_total: number
  users_active: number
  storage_used: number
  storage_quota_total?: number
  modules_active: number
  sessions_active?: number
  users_online?: number
  sessions_24h?: number
  new_users_7d?: number
  new_users_30d?: number
  users_by_role?: KV[]
  sessions_by_device?: KV[]
  modules_by_status?: KV[]
  signups_daily?: Series[]
  logins_daily?: Series[]
  events_daily?: Series[]
  top_storage?: TopStorage[]
}

const dayLabel = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '')

function StatCard({
  label, value, icon: Icon, color, accent, children,
}: {
  label: string; value: ReactNode; icon: typeof Users; color: string; accent?: ReactNode; children?: ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-col">
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a` }}>
          <Icon size={16} style={{ color }} />
        </span>
      </div>
      <p className="text-2xl font-semibold text-text-primary leading-tight">{value}</p>
      {accent && <div className="text-xs text-text-tertiary mt-1">{accent}</div>}
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

function DashboardTab() {
  const { t } = useTranslation()
  const { data: stats, isError, error, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<Stats>('/admin/stats').then((r) => r.data),
    refetchInterval: 30_000,
    retry: 2,
  })

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

      {/* ── Cartes de statistiques enrichies ── */}
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

      {/* ── Graphiques ── */}
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


// ── Admin navigation tree (Workspace-style) ──────────────────────────────────
// Collapsible sections up to 3 levels deep. A node WITH children is an
// expand-only group (not navigable — clicking toggles it). A leaf routes to
// /admin?tab=<id>. `soon` leaves render a placeholder. `secondary` top-level
// sections are hidden behind "Show more". Existing tab ids are preserved so old
// links keep working.
interface AdminNavItem {
  id:         string
  labelKey:   string
  Icon?:      LucideIcon   // top-level items only
  badge?:     string       // small chip, e.g. "BETA"
  soon?:      boolean      // renders the "coming soon" placeholder
  secondary?: boolean      // top-level: behind "Show more"
  children?:  AdminNavItem[]
}

const ADMIN_NAV: AdminNavItem[] = [
  { id: 'home',      labelKey: 'admin.nav_home',      Icon: Home },
  { id: 'dashboard', labelKey: 'admin.tab_dashboard', Icon: LayoutDashboard },
  { id: 'directory', labelKey: 'admin.nav_directory', Icon: Contact, children: [
    { id: 'users',              labelKey: 'admin.tab_users' },
    { id: 'groups',             labelKey: 'admin.tab_groups' },
    { id: 'audiences',          labelKey: 'admin.nav_audiences',          soon: true },
    { id: 'org-units',          labelKey: 'admin.nav_org_units' },
    { id: 'directory-settings', labelKey: 'admin.nav_directory_settings', soon: true },
  ] },
  { id: 'apps', labelKey: 'admin.nav_apps', Icon: LayoutGrid, children: [
    { id: 'modules',         labelKey: 'admin.nav_installed_modules' },
    { id: 'marketplace',     labelKey: 'admin.nav_marketplace' },
    { id: 'module-settings', labelKey: 'admin.nav_module_settings', soon: true },
  ] },
  { id: 'security', labelKey: 'admin.nav_security', Icon: Shield, children: [
    { id: 'sso',         labelKey: 'admin.nav_auth_sso' },
    { id: 'access-data', labelKey: 'admin.nav_access_data', soon: true },
    { id: 'security-center', labelKey: 'admin.nav_security_center', soon: true, children: [
      { id: 'security-dashboard', labelKey: 'admin.nav_security_dashboard', soon: true },
      { id: 'security-health',    labelKey: 'admin.nav_security_health',    soon: true },
    ] },
  ] },
  { id: 'account', labelKey: 'admin.nav_account', Icon: AtSign, children: [
    { id: 'settings',       labelKey: 'admin.nav_instance_profile' },
    { id: 'admin-roles',    labelKey: 'admin.nav_admin_roles' },
    { id: 'domains',        labelKey: 'admin.nav_domains',        soon: true },
    { id: 'data-migration', labelKey: 'admin.nav_data_migration', soon: true },
    { id: 'data-export',    labelKey: 'admin.nav_data_export',    soon: true },
    { id: 'apparence',      labelKey: 'admin.nav_customization' },
    { id: 'speech-to-text', labelKey: 'admin.tab_speech_to_text' },
  ] },
  { id: 'devices', labelKey: 'admin.nav_devices', Icon: MonitorSmartphone, secondary: true, children: [
    { id: 'device-sessions', labelKey: 'admin.nav_sessions',  soon: true },
    { id: 'networks',        labelKey: 'admin.nav_networks',  soon: true },
  ] },
  { id: 'reporting', labelKey: 'admin.nav_reporting', Icon: BarChart3, secondary: true, children: [
    { id: 'event-log', labelKey: 'admin.nav_event_log', soon: true },
    { id: 'audit',     labelKey: 'admin.nav_audit',     soon: true },
  ] },
  { id: 'billing', labelKey: 'admin.nav_billing', Icon: CreditCard, secondary: true, children: [
    { id: 'subscription', labelKey: 'admin.nav_subscription', soon: true },
  ] },
  { id: 'rules',   labelKey: 'admin.nav_rules',   Icon: Workflow, secondary: true, soon: true },
  { id: 'storage', labelKey: 'admin.nav_storage', Icon: Cloud,    secondary: true, soon: true },
]

// Flat index: id → { item, ancestor ids, top-level section id }. Built once.
interface NavMeta { item: AdminNavItem; ancestors: string[]; topId: string }
const NAV_INDEX = new Map<string, NavMeta>()
;(function indexNav(items: AdminNavItem[], ancestors: string[], topId: string | null) {
  for (const it of items) {
    const top = topId ?? it.id
    NAV_INDEX.set(it.id, { item: it, ancestors, topId: top })
    if (it.children) indexNav(it.children, [...ancestors, it.id], top)
  }
})(ADMIN_NAV, [], null)

// Rendered inside AppSidebar as the left panel while on /admin (replaces the
// module navigation), like the Settings sidebar. Tab selection is URL-driven.
function AdminNavTree({ collapsed }: { collapsed?: boolean }) {
  const { t }       = useTranslation()
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const active      = params.get('tab') || 'home'
  const activeMeta  = NAV_INDEX.get(active)

  // Expanded sections: seed with the active leaf's ancestor chain.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(activeMeta?.ancestors ?? []))
  // Reveal secondary sections when the active leaf lives in one.
  const [showAll, setShowAll]   = useState<boolean>(() => !!(activeMeta && NAV_INDEX.get(activeMeta.topId)?.item.secondary))

  // Keep the active leaf's ancestors expanded / its section revealed on nav.
  useEffect(() => {
    if (activeMeta?.ancestors.length) {
      setExpanded(prev => {
        const next = new Set(prev)
        activeMeta.ancestors.forEach(a => next.add(a))
        return next
      })
    }
    if (activeMeta && NAV_INDEX.get(activeMeta.topId)?.item.secondary) setShowAll(true)
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const go = (id: string) => navigate(id === 'home' ? '/admin' : `/admin?tab=${id}`)

  // Collapsed icon rail: top-level icons only; a group jumps to its first leaf.
  if (collapsed) {
    const firstLeaf = (it: AdminNavItem): string => (it.children?.length ? firstLeaf(it.children[0]) : it.id)
    return (
      <nav className="flex-1 px-2 space-y-0.5">
        {ADMIN_NAV.map(it => (
          <button
            key={it.id} type="button" title={t(it.labelKey)}
            onClick={() => go(firstLeaf(it))}
            className={`w-full flex items-center justify-center py-2.5 rounded-full transition-colors ${
              it.id === activeMeta?.topId ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-surface-2'}`}
          >
            {it.Icon && <it.Icon size={18} className="shrink-0" />}
          </button>
        ))}
      </nav>
    )
  }

  const renderItems = (items: AdminNavItem[], depth: number): ReactNode =>
    items.map(item => {
      const isGroup  = !!item.children?.length
      const isActive = !isGroup && item.id === active
      const isOpen   = expanded.has(item.id)
      // Align child labels under their parent's label (icon width only at depth 0).
      const padLeft  = depth === 0 ? 12 : 34 + (depth - 1) * 22
      return (
        <div key={item.id}>
          <button
            type="button"
            onClick={() => (isGroup ? toggle(item.id) : go(item.id))}
            aria-expanded={isGroup ? isOpen : undefined}
            style={{ paddingLeft: padLeft }}
            className={`w-full flex items-center gap-2 pr-3 py-2 rounded-full text-sm text-left transition-colors ${
              isActive
                ? 'bg-primary-light text-primary font-medium'
                : `text-text-secondary hover:bg-surface-2 ${isGroup && isOpen ? 'ring-1 ring-border' : ''}`}`}
          >
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              {isGroup && <ChevronRight size={15} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />}
            </span>
            {depth === 0 && item.Icon && <item.Icon size={18} className="shrink-0" />}
            <span className="truncate flex-1">{t(item.labelKey)}</span>
            {item.badge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-light text-primary shrink-0">
                {item.badge}
              </span>
            )}
          </button>
          {isGroup && isOpen && <div className="mt-0.5 space-y-0.5">{renderItems(item.children!, depth + 1)}</div>}
        </div>
      )
    })

  const primary   = ADMIN_NAV.filter(i => !i.secondary)
  const secondary = ADMIN_NAV.filter(i => i.secondary)

  return (
    <nav className="flex-1 px-3 space-y-0.5">
      <p className="px-3 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        {t('user.admin')}
      </p>
      {renderItems(primary, 0)}
      {showAll && renderItems(secondary, 0)}
      {secondary.length > 0 && (
        <div className="pt-1 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs text-primary border border-border hover:bg-surface-2 transition-colors"
          >
            <ChevronDown size={15} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
            {showAll ? t('admin.nav_show_less') : t('admin.nav_show_more')}
          </button>
        </div>
      )}
    </nav>
  )
}

// Placeholder for sections that are declared in the menu but not built yet.
function ComingSoon({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
        <Clock size={30} className="text-text-tertiary" />
      </div>
      <h2 className="text-lg font-medium text-text-primary">{t(titleKey)}</h2>
      <p className="text-xs text-text-secondary max-w-sm">{t('admin.soon_desc')}</p>
      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-light text-primary">{t('admin.soon_badge')}</span>
    </div>
  )
}

// ── Admin home landing (Workspace-style card dashboard) ──────────────────────
function HomeCard({ children }: { children: ReactNode }) {
  return <div className="bg-white rounded-xl border border-border p-5">{children}</div>
}

function CardHeader({ Icon, title, manageTab }: { Icon: LucideIcon; title: string; manageTab?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between mb-3 gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon size={20} className="text-text-secondary shrink-0" />
        <h3 className="text-base font-medium text-text-primary truncate">{title}</h3>
      </div>
      {manageTab && (
        <Link to={`/admin?tab=${manageTab}`} className="text-xs text-primary hover:underline shrink-0">
          {t('admin.card_manage')}
        </Link>
      )}
    </div>
  )
}

function CardLink({ to, icon, children }: { to: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-xs text-primary hover:underline py-1.5">
      {icon}{children}
    </Link>
  )
}

function AdminHome() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<Stats>('/admin/stats').then(r => r.data),
    refetchInterval: 30_000,
    retry: 2,
  })
  const num = (v?: number) => (isLoading ? '…' : (v ?? 0).toLocaleString())
  const storageUsed  = stats?.storage_used ?? 0
  const storageQuota = stats?.storage_quota_total ?? 0
  const storagePct   = storageQuota > 0 ? Math.min(100, (storageUsed / storageQuota) * 100) : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-text-primary">{t('admin.home_welcome_title')}</h1>
        <p className="text-xs text-text-secondary mt-1">{t('admin.home_welcome_sub')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {/* Users */}
        <HomeCard>
          <CardHeader Icon={Users} title={t('admin.tab_users')} manageTab="users" />
          <div className="mb-3">
            <p className="text-xs text-text-tertiary">{t('admin.home_users_active')}</p>
            <p className="text-3xl font-semibold text-text-primary leading-tight">{num(stats?.users_active)}</p>
          </div>
          <div className="border-t border-border pt-1">
            <CardLink to="/admin?tab=users"  icon={<Plus size={15} />}>{t('admin.home_add_user')}</CardLink>
            <CardLink to="/admin?tab=users"  icon={<Users size={15} />}>{t('admin.home_manage_users')}</CardLink>
            <CardLink to="/admin?tab=groups" icon={<Contact size={15} />}>{t('admin.home_view_groups')}</CardLink>
          </div>
        </HomeCard>

        {/* Applications (modules) */}
        <HomeCard>
          <CardHeader Icon={LayoutGrid} title={t('admin.nav_apps')} manageTab="modules" />
          <div className="mb-3">
            <p className="text-3xl font-semibold text-text-primary leading-tight">{num(stats?.modules_active)}</p>
            <p className="text-xs text-text-tertiary">{t('admin.home_apps_active')}</p>
          </div>
          <div className="border-t border-border pt-1">
            <CardLink to="/admin?tab=modules">{t('admin.nav_installed_modules')}</CardLink>
            <CardLink to="/admin?tab=marketplace">{t('admin.nav_marketplace')}</CardLink>
          </div>
        </HomeCard>

        {/* Storage */}
        <HomeCard>
          <CardHeader Icon={HardDrive} title={t('admin.nav_storage')} />
          <p className="text-xs text-text-secondary mb-2">{fmtBytes(storageUsed)} / {fmtBytes(storageQuota)}</p>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${storagePct}%`, background: storagePct >= 90 ? '#d93025' : '#1a73e8' }} />
          </div>
          <p className="text-xs text-text-tertiary mt-2">{t('admin.home_storage_pct', { pct: Math.round(storagePct) })}</p>
        </HomeCard>

        {/* Security */}
        <HomeCard>
          <CardHeader Icon={Shield} title={t('admin.nav_security')} manageTab="sso" />
          <p className="text-xs text-text-secondary mb-2">{t('admin.home_security_desc')}</p>
          <div className="border-t border-border pt-1">
            <CardLink to="/admin?tab=sso">{t('admin.nav_auth_sso')}</CardLink>
          </div>
        </HomeCard>

        {/* Alerts */}
        <HomeCard>
          <CardHeader Icon={Bell} title={t('admin.home_alerts_title')} />
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <Bell size={26} className="text-text-tertiary" />
            <p className="text-xs text-text-tertiary">{t('admin.home_alerts_empty')}</p>
          </div>
        </HomeCard>

        {/* Groups */}
        <HomeCard>
          <CardHeader Icon={Users} title={t('admin.tab_groups')} manageTab="groups" />
          <p className="text-xs text-text-secondary">{t('admin.home_groups_desc')}</p>
        </HomeCard>

        {/* Account settings */}
        <HomeCard>
          <CardHeader Icon={AtSign} title={t('admin.home_account_title')} manageTab="settings" />
          <p className="text-xs text-text-secondary">{t('admin.home_account_desc')}</p>
        </HomeCard>

        {/* Reports */}
        <HomeCard>
          <CardHeader Icon={BarChart3} title={t('admin.nav_reporting')} manageTab="event-log" />
          <p className="text-xs text-text-secondary">{t('admin.home_reports_desc')}</p>
        </HomeCard>
      </div>
    </div>
  )
}

// Admin "features" — actionable tasks surfaced by the search (like Workspace's
// FEATURES category). The breadcrumb shown under the label is the FULL menu path
// to `tab` (derived from the nav tree). `keys` are extra (French) search terms
// beyond the label itself.
interface AdminFeature { id: string; labelKey: string; tab: string; Icon: LucideIcon; keys: string[] }
const ADMIN_FEATURES: AdminFeature[] = [
  { id: 'add-user',     labelKey: 'admin.home_add_user',       tab: 'users',       Icon: UserPlus,   keys: ['ajouter', 'nouveau', 'creer', 'add', 'user', 'utilisateur'] },
  { id: 'delete-user',  labelKey: 'admin.feat_delete_user',    tab: 'users',       Icon: Users,      keys: ['supprimer', 'retirer', 'delete', 'utilisateur'] },
  { id: 'edit-user',    labelKey: 'admin.feat_edit_user',      tab: 'users',       Icon: Users,      keys: ['modifier', 'nom', 'email', 'edit', 'utilisateur'] },
  { id: 'create-group', labelKey: 'admin.feat_create_group',   tab: 'groups',      Icon: Contact,    keys: ['groupe', 'group', 'liste', 'diffusion'] },
  { id: 'install-mod',  labelKey: 'admin.feat_install_module', tab: 'marketplace', Icon: LayoutGrid, keys: ['installer', 'module', 'app', 'application', 'marketplace', 'marche'] },
  { id: 'config-sso',   labelKey: 'admin.feat_config_sso',     tab: 'sso',         Icon: Shield,     keys: ['sso', 'authentification', 'oauth', 'oidc', 'connexion', 'login', 'securite'] },
  { id: 'customize',    labelKey: 'admin.feat_customize',      tab: 'apparence',   Icon: AtSign,     keys: ['theme', 'apparence', 'personnalisation', 'couleur', 'logo'] },
  { id: 'view-reports', labelKey: 'admin.feat_view_reports',   tab: 'event-log',   Icon: BarChart3,  keys: ['rapport', 'journal', 'log', 'audit', 'activite'] },
  { id: 'manage-store', labelKey: 'admin.feat_manage_storage', tab: 'storage',     Icon: Cloud,      keys: ['stockage', 'storage', 'quota', 'disque'] },
]

// Full menu path (breadcrumb) to a nav id: ancestor labels + the item's own label.
function navPathLabels(t: (k: string) => string, id: string): string[] {
  const meta = NAV_INDEX.get(id)
  if (!meta) return []
  return [...meta.ancestors.map(a => t(NAV_INDEX.get(a)!.item.labelKey)), t(meta.item.labelKey)]
}

// Breadcrumb line ("A › B › C") with the last segment emphasised, like the
// Workspace admin search results.
function Breadcrumb({ segments }: { segments: string[] }) {
  return (
    <p className="text-xs text-text-tertiary truncate">
      {segments.map((s, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1 text-text-tertiary">›</span>}
          <span className={i === segments.length - 1 ? 'font-medium text-text-secondary' : ''}>{s}</span>
        </span>
      ))}
    </p>
  )
}

// One search result category (header with optional "View all" + rows).
function SearchSection({ title, viewAll, children }: { title: string; viewAll?: () => void; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="border-t border-border first:border-t-0 py-1.5">
      <div className="flex items-center justify-between px-4 pt-1 pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{title}</span>
        {viewAll && (
          <button type="button" onClick={viewAll} className="text-xs text-primary hover:underline">{t('admin.search_view_all')}</button>
        )}
      </div>
      {children}
    </div>
  )
}

function UserAvatar({ user }: { user: User }) {
  const initial = (user.display_name || user.username || user.email || '?').trim().charAt(0).toUpperCase()
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
  }
  return (
    <span className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-medium shrink-0">
      {initial}
    </span>
  )
}

// Custom shell search bar while on /admin (registered via useSearchStore, which
// makes SearchComponent replace the global bar). Categorised results like the
// Workspace admin search: real users, actionable features, settings (with a
// breadcrumb path into the nav tree).
function AdminSearchBar() {
  const { t }    = useTranslation()
  const navigate = useNavigate()
  const [q, setQ]             = useState('')
  const [open, setOpen]       = useState(false)
  const [debounced, setDebounced] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { const id = setTimeout(() => setDebounced(q.trim()), 200); return () => clearTimeout(id) }, [q])
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const needle = q.trim().toLowerCase()

  // Users — server-side search (debounced, min 2 chars).
  const { data: users } = useQuery({
    queryKey: ['admin-user-search', debounced],
    queryFn: () => api.get<{ users: User[] }>('/admin/users', { params: { search: debounced, limit: 4 } }).then(r => r.data.users),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  })

  // Features — static, matched on label + extra keywords.
  const features = useMemo(() => {
    if (!needle) return []
    return ADMIN_FEATURES.filter(f => (t(f.labelKey) + ' ' + f.keys.join(' ')).toLowerCase().includes(needle)).slice(0, 5)
  }, [needle, t])

  // Settings — nav leaves + groups, with the full menu path as breadcrumb.
  const settings = useMemo(() => {
    if (!needle) return [] as { id: string; label: string; segments: string[]; Icon?: LucideIcon }[]
    const out: { id: string; label: string; segments: string[]; Icon?: LucideIcon }[] = []
    for (const meta of NAV_INDEX.values()) {
      if (meta.item.id === 'home') continue
      const label = t(meta.item.labelKey)
      if (!label.toLowerCase().includes(needle)) continue
      out.push({
        id:       meta.item.id,
        label,
        segments: navPathLabels(t, meta.item.id),
        Icon:     NAV_INDEX.get(meta.topId)?.item.Icon,
      })
    }
    return out.slice(0, 6)
  }, [needle, t])

  // Groups are not navigable → resolve to their first descendant leaf.
  const firstLeaf = (id: string): string => {
    const it = NAV_INDEX.get(id)?.item
    return it?.children?.length ? firstLeaf(it.children[0].id) : id
  }
  const go = (to: string) => { setOpen(false); setQ(''); navigate(to) }
  const tabUrl = (tab: string, extra = '') => (tab === 'home' ? '/admin' : `/admin?tab=${tab}${extra}`)

  // Organizational units — a search category available everywhere in /admin.
  const { data: ouData } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn: () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
  })
  const orgUnits = useMemo(() => {
    if (!needle) return [] as OrgUnit[]
    return (ouData ?? []).filter(u => u.name.toLowerCase().includes(needle) || (u.description ?? '').toLowerCase().includes(needle)).slice(0, 5)
  }, [needle, ouData])

  const showUsers = debounced.length >= 2 && !!users && users.length > 0
  const hasAny    = showUsers || orgUnits.length > 0 || features.length > 0 || settings.length > 0
  const isActive  = open || !!q

  return (
    <div ref={ref} className="relative w-full">
      <div
        className="flex items-center h-12"
        style={{
          background:   isActive ? '#ffffff' : '#eaeef5',
          boxShadow:    isActive ? '0 1px 3px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.1)' : 'none',
          border:       `1px solid ${isActive ? '#e0e0e0' : 'transparent'}`,
          borderRadius: 9999,
        }}
      >
        <div className="pl-4 pr-2 shrink-0"><Search size={20} className="text-text-secondary" /></div>
        <input
          type="text" value={q}
          placeholder={t('admin.search_ph')}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="flex-1 bg-transparent outline-none min-w-0 text-text-primary placeholder:text-text-tertiary"
        />
        {q && (
          <button
            onMouseDown={e => { e.preventDefault(); setQ(''); setOpen(false) }}
            aria-label={t('shell.clear')}
            className="shrink-0 px-3 text-text-tertiary hover:text-text-primary"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && needle && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-[70] bg-white rounded-2xl border border-border overflow-hidden max-h-[70vh] overflow-y-auto"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.16)' }}
        >
          {showUsers && (
            <SearchSection
              title={t('admin.search_cat_users')}
              viewAll={() => go(tabUrl('users', `&q=${encodeURIComponent(q.trim())}`))}
            >
              {users!.map(u => (
                <button
                  key={u.id} type="button"
                  onClick={() => go(tabUrl('users', `&q=${encodeURIComponent(u.email)}`))}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-surface-2 transition-colors"
                >
                  <UserAvatar user={u} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{u.display_name || u.username}</p>
                    <p className="text-xs text-text-tertiary truncate">{u.email}</p>
                  </div>
                </button>
              ))}
            </SearchSection>
          )}

          {orgUnits.length > 0 && (
            <SearchSection title={t('admin.nav_org_units')}>
              {orgUnits.map(u => (
                <button
                  key={u.id} type="button"
                  onClick={() => go(tabUrl('org-units', `&q=${encodeURIComponent(u.name)}`))}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-surface-2 transition-colors"
                >
                  <Building2 size={18} className="text-text-tertiary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-primary truncate">{u.name}</p>
                    {u.description && <p className="text-xs text-text-tertiary truncate">{u.description}</p>}
                  </div>
                </button>
              ))}
            </SearchSection>
          )}

          {features.length > 0 && (
            <SearchSection title={t('admin.search_cat_features')}>
              {features.map(f => (
                <button
                  key={f.id} type="button" onClick={() => go(tabUrl(f.tab))}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-surface-2 transition-colors"
                >
                  <f.Icon size={18} className="text-text-tertiary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-primary truncate">{t(f.labelKey)}</p>
                    <Breadcrumb segments={navPathLabels(t, f.tab)} />
                  </div>
                </button>
              ))}
            </SearchSection>
          )}

          {settings.length > 0 && (
            <SearchSection title={t('admin.search_cat_settings')}>
              {settings.map(s => (
                <button
                  key={s.id} type="button" onClick={() => go(tabUrl(firstLeaf(s.id)))}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-surface-2 transition-colors"
                >
                  {s.Icon
                    ? <s.Icon size={18} className="text-text-tertiary shrink-0" />
                    : <Search size={18} className="text-text-tertiary shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-xs text-text-primary truncate">{s.label}</p>
                    {s.segments.length > 1 && <Breadcrumb segments={s.segments} />}
                  </div>
                </button>
              ))}
            </SearchSection>
          )}

          {!hasAny && <p className="px-4 py-4 text-xs text-text-tertiary">{t('admin.search_no_results')}</p>}
        </div>
      )}
    </div>
  )
}

// Override the left panel on /admin (registered once at module load; resolves
// only when the route is /admin, so it is inert elsewhere).
useSidebarStore.getState().register({
  moduleId:      'core-admin',
  routePrefix:   '/admin',
  SidebarBody:   AdminNavTree,
  collapsedBody: true,
})

// Inset the module area content by 24px on /admin (registered once, inert
// elsewhere: `routePrefix: '/admin'` only resolves under that route).
useToolbarStore.getState().register({
  moduleId:    'core-admin',
  routePrefix: '/admin',
  padding:     24,
})

// Override the global shell search bar while on /admin (inert elsewhere).
useSearchStore.getState().register({
  moduleId:        'core-admin',
  routePrefix:     '/admin',
  placeholder:     'Rechercher des utilisateurs, groupes ou paramètres',
  placeholderKey:  'admin.search_ph',
  SearchComponent: AdminSearchBar,
})

export default function AdminPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tab = params.get('tab') || 'home'

  if (user?.role !== 'admin') return <Navigate to="/" replace />

  const meta     = NAV_INDEX.get(tab)
  const titleKey = meta?.item.labelKey

  return (
    <div>
      {/* Home and the roles panel render their own header (landing / breadcrumb). */}
      {tab !== 'home' && tab !== 'admin-roles' && (
        <h1 className="text-xl font-medium text-text-primary mb-6">
          {titleKey ? t(titleKey) : t('user.admin')}
        </h1>
      )}

      {tab === 'home'      && <AdminHome />}
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'users'     && <UsersPanel />}
      {tab === 'groups'    && <GroupsPanel />}
      {tab === 'org-units' && <OrgUnitsPanel />}
      {tab === 'modules'   && <ModulesPanel />}
      {tab === 'marketplace' && <MarketplacePanel onBack={() => navigate('/admin?tab=modules')} related={params.get('related')} />}
      {tab === 'sso'       && <OAuthProvidersPanel />}
      {tab === 'admin-roles' && <AdminRolesPanel />}
      {tab === 'settings'  && <SettingsPanel />}
      {tab === 'apparence' && <><ThemesPanel /><LoginAnimationPanel /></>}
      {tab === 'speech-to-text' && <SpeechToTextPanel />}
      {meta?.item.soon && <ComingSoon titleKey={titleKey ?? 'user.admin'} />}

      <Slot name="admin-panels" />
    </div>
  )
}
