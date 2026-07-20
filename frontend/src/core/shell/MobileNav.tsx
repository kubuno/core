import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Grid, Settings, type LucideIcon } from 'lucide-react'
import { useSidebarStore, resolveActiveSidebarConfig, type MobileNavTab } from '../store/sidebarStore'

/**
 * Primary mobile navigation. Two placements share one set of destinations:
 *  · `variant="bottom"` (default) — a fixed bottom bar, used in portrait.
 *  · `variant="rail"` — a vertical left rail rendered in the shell's flex flow,
 *    used in landscape where a bottom bar would eat the already-short height
 *    (mirrors the Google Drive tablet/landscape layout).
 *
 * Destinations come from the active module's `mobileTabs` (Drive: Home /
 * Starred / Shared / Files) and fall back to the shell's generic ones. Modules
 * never render their own bar — that would stack two of them.
 */
export default function MobileNav({ variant = 'bottom' }: { variant?: 'bottom' | 'rail' }) {
  const { t } = useTranslation()
  const { t: tn } = useTranslation('nav')
  const { pathname } = useLocation()
  const configs = useSidebarStore(s => s.configs)

  const active = resolveActiveSidebarConfig(configs, pathname)
  // Modules that own their whole chrome (office/paintsharp editors) get no bar.
  const tabs = active?.hideSidebar ? undefined : active?.mobileTabs

  const generic: { to: string; end?: boolean; Icon: LucideIcon; label: string }[] = [
    { to: '/', end: true, Icon: Home, label: tn('home', { defaultValue: 'Accueil' }) },
    { to: '/modules', Icon: Grid, label: tn('modules', { defaultValue: 'Modules' }) },
    { to: '/settings', Icon: Settings, label: t('user.settings') },
  ]

  const items = tabs?.length
    ? tabs.map(tab => <NavItem key={tab.id} tab={tab} rail={variant === 'rail'} />)
    : generic.map(g => <NavItem key={g.to} tab={{ id: g.to, path: g.to, end: g.end, Icon: g.Icon, label: g.label }} rail={variant === 'rail'} />)

  if (variant === 'rail') {
    // Rendered in the shell's flex flow (left of the module area) only when the
    // shell decides we're a phone in landscape — no visibility variants here.
    return (
      <nav data-app-chrome
           className="flex flex-col items-stretch gap-1 py-2 w-[68px] h-full overflow-y-auto
                      rounded-xl bg-white border border-border">
        {items}
      </nav>
    )
  }

  return (
    <nav data-app-chrome
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
         className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border lg:hidden">
      {/* 56px row of items; the nav's safe-area padding extends the white
          background below it, over the home indicator. */}
      <div className="flex justify-around items-center h-14">
        {items}
      </div>
    </nav>
  )
}

/** One destination. Active state mirrors the Drive/Material look: a tinted
 *  rounded rectangle behind the icon (bottom bar) or wrapping the whole item —
 *  icon + label — with side margins (rail). */
function NavItem({ tab, rail }: { tab: MobileNavTab; rail: boolean }) {
  const { t } = useTranslation()
  const label = tab.labelKey ? t(tab.labelKey, { defaultValue: tab.label ?? tab.id }) : (tab.label ?? tab.id)
  const Icon = tab.Icon
  return (
    <NavLink to={tab.path} end={tab.end ?? false} title={label}
             className={({ isActive }) => `flex flex-col items-center gap-0.5 min-w-0 transition-colors
               ${rail
                 ? `mx-2 px-1 py-2 rounded-lg ${isActive ? 'bg-primary-light text-primary' : 'text-text-secondary'}`
                 : 'px-3 py-1 text-xs'}`}>
      {({ isActive }) => (
        <>
          {/* Bottom bar keeps the pill behind the icon; the rail highlights the
              whole item (icon colour inherited from the NavLink). */}
          <span className={`flex items-center justify-center h-7 transition-colors
                            ${rail ? 'w-full' : `w-16 rounded-2xl ${isActive ? 'bg-primary-light text-primary' : 'text-text-secondary'}`}`}>
            <Icon size={21} />
          </span>
          <span className={`truncate ${rail ? 'max-w-[60px] text-[11px]' : 'max-w-[5.5rem] text-xs'}
                            ${isActive ? 'text-primary font-medium' : 'text-text-secondary'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
