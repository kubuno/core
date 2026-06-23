import { useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Bell, Settings, HelpCircle, Info, BookOpen, Calendar, PhoneMissed, type LucideIcon,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { useModulesStore } from '../store/modulesStore'
import { useNotificationStore } from '../store/notificationStore'
import { Slot, SlotRegistry, ModuleSettingsRegistry } from '../slots/SlotRegistry'
import { WaffleAppRegistry } from '../registry/WaffleAppRegistry'
import UserPanel from './UserPanel'
import AddAccountModal from '../components/AddAccountModal'
import WaffleMenu from './WaffleMenu'

const NOTIF_ICONS: Record<string, LucideIcon> = { Calendar, PhoneMissed }

// Cluster d'actions de l'en-tête (langue, notifications, réglages, aide, waffle,
// avatar). Extrait de l'AppHeader pour être réutilisable : l'AppHeader global le
// rend, mais les sous-modules à barre de titre le rendent AUSSI dans leur barre
// (mode `compact`) après avoir masqué l'AppHeader — gain de hauteur verticale.
export default function HeaderActions({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { activeModules } = useModulesStore()
  const activeIds = new Set(activeModules.map(m => m.module_id))
  const SettingsButtonOverride = SlotRegistry.getActiveOverride<{ compact?: boolean; dark?: boolean }>('topbar-settings', activeIds)
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore()
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const isHome = pathname === '/'
  // Per-user settings of the module the user is currently inside (e.g. /photos/… →
  // /photos/settings). Falls back to the global settings page when the current
  // module has no per-user settings page registered.
  const moduleSettingsRoute = ModuleSettingsRegistry.getRoute(pathname.split('/')[1], activeIds)
  const [panelOpen, setPanelOpen]           = useState(false)
  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const avatarBtnRef = useRef<HTMLButtonElement>(null)

  const initials = user?.display_name
    ? user.display_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? '?'

  const allWaffleApps = activeModules.flatMap((m) => {
    const entry = WaffleAppRegistry.get(m.module_id)
    // On rattache moduleId/moduleLabel à chaque app pour que le WaffleMenu puisse
    // regrouper les sous-modules d'un même module (ex. Office, PaintSharp).
    return entry ? entry.apps.map(a => ({ ...a, moduleId: entry.moduleId, moduleLabel: entry.label })) : []
  })

  // Tailles : compact (barre de titre de sous-module) vs normal (AppHeader).
  // `dark` : variante sombre pour les topbars PaintSharp (#111) — icônes claires sur fond
  // sombre, hover translucide ; les popovers restent des overlays blancs portés.
  const ico = compact ? 18 : 20
  // Pas d'anneau de focus sur ces boutons d'en-tête : `focus:outline-none` supprime le
  // cercle (outline navigateur). On NE met PAS de `focus-visible:ring` car les triggers
  // de menus Radix restaurent le focus par programme à la fermeture → le navigateur
  // applique alors `:focus-visible` et l'anneau réapparaîtrait (le « parfois » signalé).
  const btn = `${compact ? 'w-9 h-9' : 'w-12 h-12'} rounded-full flex items-center justify-center transition-colors focus:outline-none ${
    dark ? 'text-white/75 hover:bg-white/15 data-[state=open]:bg-white/15' : 'text-text-secondary hover:bg-surface-3 data-[state=open]:bg-surface-3'}`

  return (
    <div className="flex items-center gap-0 flex-shrink-0">
      <Slot name="header-actions-right" />
      <Slot name="topbar-actions" />

      {/* Notifications */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className={`${btn} relative`}
            aria-label={t('header.notifications')}
          >
            <Bell size={ico} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={4}
            className="w-80 max-h-96 overflow-y-auto bg-white rounded-[5px] border border-border shadow-lg z-[9999] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border sticky top-0 bg-white z-10">
              <span className="text-sm font-semibold text-text-primary">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:text-primary-hover transition-colors">
                  {t('header.mark_all_read', { defaultValue: 'Tout lire' })}
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-text-tertiary">
                {t('header.no_notifications', { defaultValue: 'Aucune notification' })}
              </div>
            ) : (
              <div>
                {notifications.map(notif => (
                  <DropdownMenu.Item key={notif.id}
                    onSelect={() => { markRead(notif.id); if (notif.link) navigate(notif.link) }}
                    className={`flex items-start gap-3 px-3 py-3 cursor-pointer outline-none hover:bg-surface-1 transition-colors border-b border-border/50 last:border-0 ${notif.read ? 'opacity-60' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      {(() => { const Icon = (notif.icon && NOTIF_ICONS[notif.icon]) ? NOTIF_ICONS[notif.icon] : Calendar; return <Icon size={14} className="text-primary" /> })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug truncate ${notif.read ? 'font-normal text-text-secondary' : 'font-semibold text-text-primary'}`}>{notif.title}</p>
                        <span className="text-[10px] text-text-tertiary shrink-0 mt-0.5">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}</span>
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{notif.body}</p>
                    </div>
                  </DropdownMenu.Item>
                ))}
              </div>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Paramètres — masqué sur la page d'accueil. <button> (et non <Link>) pour être
          homogène avec les autres icônes d'en-tête (même cercle de survol/focus). */}
      {isHome ? null : SettingsButtonOverride ? (
        <SettingsButtonOverride compact={compact} dark={dark} />
      ) : (
        <button onClick={() => navigate(moduleSettingsRoute ?? '/settings')}
          className={btn}
          aria-label={t('header.settings')}>
          <Settings size={ico} />
        </button>
      )}

      {/* Aide — masquée sur mobile (place à la recherche ; « À propos » reste
          accessible via le panneau du compte / la page À propos). */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className={`${btn} hidden lg:flex`}>
            <HelpCircle size={ico} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={4}
            className="min-w-52 bg-white rounded-[5px] border border-border shadow-lg py-1 z-[9999]">
            <Slot name="help-menu-items" />
            <DropdownMenu.Item asChild>
              <a href="https://github.com/kubuno/kubuno/wiki" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-1 cursor-pointer outline-none">
                <BookOpen size={16} className="text-text-secondary" />
                {t('header.help_link')}
              </a>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-border mx-2" />
            <DropdownMenu.Item asChild>
              <Link to="/about"
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-1 cursor-pointer outline-none">
                <Info size={16} className="text-text-secondary" />
                {t('header.about')}
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Grille d'apps : masquée sur mobile — la barre de navigation du bas
          (« Modules ») remplit ce rôle et la page /modules liste tout. */}
      <div className="hidden lg:block">
        <WaffleMenu allApps={allWaffleApps} compact={compact} dark={dark} />
      </div>

      {/* Avatar — ouvre le UserPanel. Même gabarit que les autres icônes (cercle 48px
          en normal / 36px en compact) → aligné verticalement et de la même dimension
          que les cercles gris de survol. */}
      <button ref={avatarBtnRef} onClick={() => setPanelOpen(v => !v)}
        className={`${compact ? 'w-9 h-9 ml-0.5' : 'w-12 h-12 ml-1'} flex items-center justify-center flex-shrink-0 rounded-full outline-none focus:outline-none`}>
        <Avatar.Root className={`${compact ? 'w-9 h-9' : 'w-12 h-12'} rounded-full overflow-hidden bg-primary flex items-center justify-center`}>
          {user?.avatar_url ? (
            <Avatar.Image src={user.avatar_url} alt={user.display_name ?? user.username} className="w-full h-full object-cover" />
          ) : null}
          <Avatar.Fallback className={`text-white font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{initials}</Avatar.Fallback>
        </Avatar.Root>
      </button>

      <UserPanel open={panelOpen} onClose={() => setPanelOpen(false)} onAddAccount={() => setAddAccountOpen(true)} anchorRef={avatarBtnRef} />
      <AddAccountModal open={addAccountOpen} onClose={() => setAddAccountOpen(false)} />
    </div>
  )
}
