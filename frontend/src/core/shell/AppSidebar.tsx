import { useLocation, NavLink, Link } from 'react-router-dom'
import { KubunoLogo } from '@ui'
import { useTranslation } from 'react-i18next'
import {
  Home, Star, Trash2, Plus, Clock, ChevronLeft, ChevronRight,
  Cloud, Image, Calendar, MessageSquare, FileText, CheckSquare,
  BookOpen, Music, Video, Code, FolderOpen, Share2,
  // Icônes utilisées par les modules (PaintSharp, Office, etc.) — sinon fallback Cloud
  BarChart3, Bot, Box, Clapperboard, ClipboardList, Code2, Contact, FileEdit,
  Film, FolderKanban, KeyRound, LayoutTemplate, Mail, Map, Network, Palette,
  PenTool, StickyNote, TableProperties, Tv, Zap,
  type LucideIcon,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useModulesStore } from '../store/modulesStore'
import { useUiStore } from '../store/uiStore'
import { useSidebarStore, resolveActiveSidebarConfig } from '../store/sidebarStore'
import { Slot, SlotRegistry } from '../slots/SlotRegistry'
import type { SidebarItem } from '../types'

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Star, Trash2, Clock, Cloud, Image, Calendar,
  MessageSquare, FileText, CheckSquare, BookOpen,
  Music, Video, Code, FolderOpen, Share2,
  // Modules
  BarChart3, Bot, Box, Clapperboard, ClipboardList, Code2, Contact, FileEdit,
  Film, FolderKanban, KeyRound, LayoutTemplate, Mail, Map, Network, Palette,
  PenTool, StickyNote, TableProperties, Tv, Zap,
}

function SidebarIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? Cloud
  return <Icon size={20} />
}

function SidebarLink({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) {
  const { closeSidebar } = useUiStore()
  const { t } = useTranslation('nav')
  const label = t(item.id, { defaultValue: item.label })
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={closeSidebar}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 py-2 rounded-full text-sm font-medium relative
         transition-all cursor-pointer select-none
         ${collapsed ? 'justify-center px-2' : 'px-3'}
         ${isActive
           ? 'bg-primary-light'
           : 'hover:bg-[#e4ecf7]'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className="flex-shrink-0 transition-colors"
            style={{ color: isActive ? '#1a73e8' : '#5f6368' }}
          >
            <SidebarIcon name={item.icon} />
          </span>
          {!collapsed && (
            <span
              className="flex-1 truncate"
              style={{ color: isActive ? '#041e49' : '#5f6368', fontWeight: isActive ? 600 : 400 }}
            >
              {label}
            </span>
          )}
          {!collapsed && item.badge != null && item.badge > 0 && (
            <span
              className="text-xs text-white rounded-full min-w-[18px] h-[18px]
                         flex items-center justify-center px-1 font-medium"
              style={{ background: '#d93025' }}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
          {collapsed && item.badge != null && item.badge > 0 && (
            <span
              className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
              style={{ background: '#d93025' }}
            />
          )}
        </>
      )}
    </NavLink>
  )
}

export default function AppSidebar() {
  const { t: tc } = useTranslation()
  const { sidebarItems } = useModulesStore()
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, headerHidden } = useUiStore()
  const { configs } = useSidebarStore()
  const { pathname } = useLocation()

  const activeConfig = resolveActiveSidebarConfig(configs, pathname)

  // Racines de premier niveau de chaque module ("/files", "/calendar"…)
  const moduleRoots = new Set(
    configs
      .map((c) => '/' + c.routePrefix.split('/').filter(Boolean)[0])
      .filter(Boolean)
  )

  const allMain      = sidebarItems.filter((i) => i.section !== 'secondary')
  const allSecondary = sidebarItems.filter((i) => i.section === 'secondary')

  const filterItems = (items: typeof allMain) => {
    if (!activeConfig) {
      return items.filter((i) => i.path === '/' || moduleRoots.has(i.path))
    }
    const prefix = activeConfig.routePrefix
    return items.filter((i) => i.path === prefix || i.path.startsWith(prefix + '/'))
  }

  // Même source d'items en replié comme en déplié : seul le rendu change (icônes
  // sans libellé). Évite la divergence où la sidebar repliée montrait d'autres
  // boutons que la version dépliée.
  const mainItems      = filterItems(allMain)
  const secondaryItems = filterItems(allSecondary)

  // Le bouton "Nouveau" ne s'affiche que si le MODULE ACTIF a des actions enregistrées
  const hasSlotActions = activeConfig != null &&
    SlotRegistry.getSlot('sidebar-new-actions')
      .some((entry) => entry.moduleId === activeConfig.moduleId)
  const showNewButton = !!(activeConfig?.NewActions || hasSlotActions)

  const newButtonLabel      = activeConfig?.newButtonLabelKey
    ? tc(activeConfig.newButtonLabelKey)
    : (activeConfig?.newButtonLabel ?? tc('shell.new'))
  const NewActionsComponent = activeConfig?.NewActions ?? null

  // Le panneau est « vide » quand il n'a ni corps de module (`SidebarBody`) ni
  // item de navigation à afficher.
  const bodyEmpty =
    !activeConfig?.SidebarBody && mainItems.length === 0 && secondaryItems.length === 0

  // Le module demande à gérer sa propre navigation interne
  if (activeConfig?.hideSidebar) return null

  // Panneau vide :
  //  • avec bouton « Nouveau » → on garde le rail enroulé par défaut (accès au +) ;
  //  • sans bouton « Nouveau » → on masque entièrement la sidebar.
  if (bodyEmpty && !showNewButton) return null
  const forceCollapsed = bodyEmpty && showNewButton
  const collapsed = sidebarCollapsed || forceCollapsed

  return (
    <aside
      data-module={activeConfig?.moduleId}
      data-app-chrome
      className={`
        fixed left-0 bottom-0 flex flex-col overflow-hidden
        z-50 transition-all duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto lg:rounded-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'w-16' : 'w-64'}
        top-16 lg:top-auto
      `}
      style={{ background: 'var(--body-bg)' }}
    >
      {/* ── Logo Kubuno — affiché ici quand l'AppHeader global est masqué (sous-module
             à barre de titre), pour qu'il reste en place en haut à gauche. ── */}
      {headerHidden && (
        <Link
          to="/"
          className={`flex items-center gap-1.5 mb-8 flex-shrink-0 hover:opacity-90 transition-opacity ${collapsed ? 'justify-center' : 'pl-2 pr-3'}`}
          style={{ height: 32 }}
        >
          <KubunoLogo size={22} className="text-primary" />
          {!collapsed && (
            <span className="text-[22px] font-normal" style={{ color: '#5f6368', letterSpacing: '-0.01em' }}>Kubuno</span>
          )}
        </Link>
      )}

      {/* ── Bouton Nouveau / Créer ─────────────────────────────────────── */}
      {showNewButton && !collapsed && (
        <div className="px-3 flex items-center" style={{ height: 72 }}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              {/* Anchor, never a <button>: the whole left panel is links. It only
                  opens a menu, so href='#' + preventDefault. */}
              <a
                href="#"
                role="button"
                onClick={e => e.preventDefault()}
                className="flex items-center gap-2 bg-white text-sm font-medium text-text-primary cursor-pointer"
                style={{
                  padding: '20px 25px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
              >
                {/* Icône + multicolore style Google */}
                <GooglePlusIcon />
                {newButtonLabel}
              </a>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side="bottom"
                align="start"
                sideOffset={4}
                className="min-w-52 bg-white rounded-[5px] border border-border shadow-lg py-1 z-50"
              >
                {NewActionsComponent ? (
                  <NewActionsComponent />
                ) : (
                  <Slot
                    name="sidebar-new-actions"
                    fallback={
                      <div className="px-4 py-2 text-xs text-text-tertiary">{tc('shell.no_active_module')}</div>
                    }
                  />
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}

      {/* Icône "+" compacte en mode collapsed */}
      {showNewButton && collapsed && (
        <div className="flex justify-center items-center" style={{ height: 72 }}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <a
                href="#"
                role="button"
                onClick={e => e.preventDefault()}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-full
                           transition-shadow cursor-pointer"
                style={{ boxShadow: '0 1px 3px rgba(60,64,67,0.3), 0 4px 8px rgba(60,64,67,0.15)' }}
                aria-label={newButtonLabel}
              >
                <Plus size={20} className="text-text-secondary" />
              </a>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side="right"
                align="start"
                sideOffset={8}
                className="min-w-52 bg-white rounded-[5px] border border-border shadow-lg py-1 z-50"
              >
                {NewActionsComponent ? <NewActionsComponent /> : <Slot name="sidebar-new-actions" />}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}

      {/* ── Corps de la sidebar ────────────────────────────────────────── */}
      {/* Le SidebarBody du module est rendu dans LES DEUX états (replié/déplié) en
          lui passant `collapsed`, pour que la nav reste identique — au lieu de
          retomber sur la liste générique quand replié. */}
      {activeConfig?.SidebarBody && (!collapsed || activeConfig.collapsedBody) ? (
        <activeConfig.SidebarBody collapsed={collapsed} />
      ) : (
        <>
          <nav className={`flex-1 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
            {mainItems.map((item) => (
              <SidebarLink key={item.id} item={item} collapsed={collapsed} />
            ))}
          </nav>

          {secondaryItems.length > 0 && (
            <>
              <div className="mx-3 my-2 h-px bg-border" />
              <nav className={`space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
                {secondaryItems.map((item) => (
                  <SidebarLink key={item.id} item={item} collapsed={collapsed} />
                ))}
              </nav>
            </>
          )}

          {!collapsed && (
            <div className="mt-1">
              <Slot name="sidebar-footer" />
              <Slot name="sidebar-storage" />
            </div>
          )}
        </>
      )}

      {/* Lien Administration déplacé dans le menu du compte (UserPanel). */}

      {/* ── Bouton collapse desktop ────────────────────────────────────── */}
      {/* Masqué quand le panneau est forcé en mode enroulé (vide + bouton
          « Nouveau ») : il n'y a rien à déplier. */}
      {!forceCollapsed && (
        <div className={`hidden lg:flex pt-1 pb-1 ${collapsed ? 'justify-center' : 'justify-end px-2'}`}>
          <a
            href="#"
            role="button"
            onClick={e => { e.preventDefault(); toggleSidebarCollapsed() }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            style={{ color: '#80868b' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f3f4'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label={collapsed ? tc('shell.expand_sidebar') : tc('shell.collapse_sidebar')}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </a>
        </div>
      )}
    </aside>
  )
}

/* Icône + avec les 4 couleurs Google */
function GooglePlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="2" x2="10" y2="18" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="2"  y1="10" x2="18" y2="10" stroke="#34a853" strokeWidth="2.5" strokeLinecap="round" />
      {/* Quart haut-gauche rouge, quart bas-droit jaune */}
      <line x1="10" y1="2" x2="10" y2="10"  stroke="#d93025" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="2"  y1="10" x2="10" y2="10" stroke="#d93025" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="10" x2="10" y2="18" stroke="#34a853" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="10" x2="18" y2="10" stroke="#f9ab00" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
