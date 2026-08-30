import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  BarChart3, Building2, Contact, HardDrive, LayoutGrid, Plus, Shield, Users, type LucideIcon,
} from 'lucide-react'
import { fmtBytes } from '../DashboardCharts'
import { canSeeTab } from '../adminNav'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import { useAdminStats } from './adminStats'
import { adminUrl } from '../adminAction'
import GettingStartedCard from '../health/GettingStartedCard'
import AlertsCard from '../alerts/AlertsCard'

// ── Admin home landing (Workspace-style card dashboard) ──────────────────────
function HomeCard({ children }: { children: ReactNode }) {
  return <div className="bg-[#F0F4F9] rounded-xl border border-border p-5">{children}</div>
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
        <Link to={adminUrl({ tab: manageTab })} className="text-sm text-primary hover:underline shrink-0">
          {t('admin.card_manage')}
        </Link>
      )}
    </div>
  )
}

function CardLink({ to, icon, children }: { to: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-sm text-primary hover:underline py-1.5">
      {icon}{children}
    </Link>
  )
}

export default function HomeSection() {
  const { t } = useTranslation()
  const { can } = usePrivileges()
  const { data: stats, isLoading } = useAdminStats()
  // Every card is a shortcut into a section: a card whose section is hidden from
  // the menu must not reappear here, and a figure the caller may not read is not
  // shown as "0".
  const sees = (tab: string) => canSeeTab(tab, can)
  const hasStats = can(PRIV.STATS_READ)
  const num = (v?: number) => (isLoading ? '…' : (v ?? 0).toLocaleString())
  const storageUsed  = stats?.storage_used ?? 0
  const storageQuota = stats?.storage_quota_total ?? 0
  const storagePct   = storageQuota > 0 ? Math.min(100, (storageUsed / storageQuota) * 100) : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-text-primary">{t('admin.home_welcome_title')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('admin.home_welcome_sub')}</p>
      </div>

      {/* Ahead of the card grid, and gone once every finding is settled: an
          instance is judged by what is still wrong, not by a wall of tiles. */}
      <GettingStartedCard />

      {/* `items-stretch` (the grid default): cards on the same row take the
          height of the tallest one, so a row never looks ragged. Each card is a
          direct grid item, so it stretches on its own — no inner `h-full`. */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 items-stretch">
        {/* Users */}
        {sees('users') && (
          <HomeCard>
            <CardHeader Icon={Users} title={t('admin.tab_users')} manageTab="users" />
            {hasStats && (
              <div className="mb-3">
                <p className="text-sm text-text-tertiary">{t('admin.home_users_active')}</p>
                <p className="text-3xl font-semibold text-text-primary leading-tight">{num(stats?.users_active)}</p>
              </div>
            )}
            <div className="border-t border-border pt-1">
              <CardLink to={adminUrl({ tab: 'users' })}  icon={<Plus size={15} />}>{t('admin.home_add_user')}</CardLink>
              <CardLink to={adminUrl({ tab: 'users' })}  icon={<Users size={15} />}>{t('admin.home_manage_users')}</CardLink>
              {sees('groups') && (
                <CardLink to={adminUrl({ tab: 'groups' })} icon={<Contact size={15} />}>{t('admin.home_view_groups')}</CardLink>
              )}
            </div>
          </HomeCard>
        )}

        {/* Applications (modules) */}
        {sees('modules') && (
          <HomeCard>
            <CardHeader Icon={LayoutGrid} title={t('admin.nav_apps')} manageTab="modules" />
            {hasStats && (
              <div className="mb-3">
                <p className="text-3xl font-semibold text-text-primary leading-tight">{num(stats?.modules_active)}</p>
                <p className="text-sm text-text-tertiary">{t('admin.home_apps_active')}</p>
              </div>
            )}
            <div className="border-t border-border pt-1">
              <CardLink to={adminUrl({ tab: 'modules' })}>{t('admin.nav_installed_modules')}</CardLink>
              {sees('marketplace') && <CardLink to={adminUrl({ tab: 'marketplace' })}>{t('admin.nav_marketplace')}</CardLink>}
            </div>
          </HomeCard>
        )}

        {/* Storage — pure statistics, so it follows `core.stats.read`. */}
        {hasStats && (
          <HomeCard>
            <CardHeader Icon={HardDrive} title={t('admin.nav_storage')} />
            <p className="text-sm text-text-secondary mb-2">{fmtBytes(storageUsed)} / {fmtBytes(storageQuota)}</p>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${storagePct}%`, background: storagePct >= 90 ? '#d93025' : '#1a73e8' }} />
            </div>
            <p className="text-sm text-text-tertiary mt-2">{t('admin.home_storage_pct', { pct: Math.round(storagePct) })}</p>
          </HomeCard>
        )}

        {/* Security */}
        {sees('sso') && (
          <HomeCard>
            <CardHeader Icon={Shield} title={t('admin.nav_security')} manageTab="sso" />
            <p className="text-sm text-text-secondary mb-2">{t('admin.home_security_desc')}</p>
            <div className="border-t border-border pt-1">
              <CardLink to={adminUrl({ tab: 'sso' })}>{t('admin.nav_auth_sso')}</CardLink>
            </div>
          </HomeCard>
        )}

        {/* Alerts. It used to be a hard-coded card with no data source at all,
            which meant it told every operator on every instance that nothing
            was wrong, for ever. It now reads the queue — and is hidden from a
            caller who cannot open the section behind it. */}
        {sees('alerts') && <AlertsCard />}

        {/* Groups */}
        {sees('groups') && (
          <HomeCard>
            <CardHeader Icon={Users} title={t('admin.tab_groups')} manageTab="groups" />
            <p className="text-sm text-text-secondary">{t('admin.home_groups_desc')}</p>
          </HomeCard>
        )}

        {/* Instance identity */}
        {sees('settings') && (
          <HomeCard>
            <CardHeader Icon={Building2} title={t('admin.home_account_title')} manageTab="settings" />
            <p className="text-sm text-text-secondary">{t('admin.home_account_desc')}</p>
          </HomeCard>
        )}

        {/* Reports */}
        {sees('event-log') && (
          <HomeCard>
            <CardHeader Icon={BarChart3} title={t('admin.nav_reporting')} manageTab="event-log" />
            <p className="text-sm text-text-secondary">{t('admin.home_reports_desc')}</p>
          </HomeCard>
        )}
      </div>
    </div>
  )
}
