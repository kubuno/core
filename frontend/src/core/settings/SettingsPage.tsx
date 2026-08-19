import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useIsMobile } from '@ui'
import { Slot } from '../slots/SlotRegistry'
// Importing `navigation` also registers the /settings left panel (side effect).
import { useSettingsNav, MobileSettingsIndex, type Tab } from './navigation'
import { ProfileTab } from './sections/ProfileTab'
import { NotificationsTab } from './sections/NotificationsTab'
import { ThemesTab } from './sections/ThemesTab'
import { ClientsTab } from './sections/ClientsTab'
import { SecurityTab } from './sections/SecurityTab'
import { SessionsTab } from './sections/SessionsTab'
import { ApiTokensTab } from './sections/ApiTokensTab'
import { MyDataTab } from './sections/my-data/MyDataTab'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const rawTab = params.get('tab')
  const tab = (rawTab as Tab) || 'profile'

  // The sections this account actually has — a tab gated off by a feature
  // switch is absent from it, so `?tab=` cannot paint one by hand.
  const nav = useSettingsNav()
  const current = nav.find(navItem => navItem.id === tab)

  // Mobile, no section chosen → the index (see MobileSettingsIndex).
  if (isMobile && !rawTab) return <MobileSettingsIndex />

  return (
    <div className="max-w-4xl">
      {isMobile ? (
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 -ml-1 mb-4 h-11 pr-3 pl-1 rounded-lg text-text-primary active:bg-surface-2 transition-colors"
        >
          <ArrowLeft size={20} className="shrink-0" />
          <span className="text-lg font-medium truncate">
            {current ? t(current.labelKey, { defaultValue: current.defaultLabel }) : t('settings.page_title')}
          </span>
        </button>
      ) : (
        <h1 className="text-xl font-medium text-text-primary mb-6">
          {current ? t(current.labelKey, { defaultValue: current.defaultLabel }) : t('settings.page_title')}
        </h1>
      )}

      {tab === 'profile'       && <ProfileTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'themes'        && <ThemesTab />}
      {tab === 'clients'       && <ClientsTab />}
      {tab === 'security'      && <SecurityTab />}
      {tab === 'sessions'      && <SessionsTab />}
      {tab === 'api-tokens'    && <ApiTokensTab />}
      {tab === 'my-data'       && !!current && <MyDataTab />}

      {/* On mobile these live in the index, not under every section. */}
      {!isMobile && <Slot name="settings-sections" />}
    </div>
  )
}
