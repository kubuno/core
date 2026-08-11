import { useCallback, useRef, useState } from 'react'
import { useLocation, NavLink, Link } from 'react-router-dom'
import { KubunoLogo, useIsMobile } from '@ui'
import { useTranslation } from 'react-i18next'
import {
  Home, Star, Trash2, Clock, GripVertical,
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
    // Collapse ANIMATES rather than snapping: constant padding + a fixed-width icon
    // box (so the icon lands centred in the 64px rail without a justify switch that
    // would make it jump), and the label collapses its width/opacity/margin. The
    // link width follows its content, so it glides in step with the aside width.
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={closeSidebar}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center px-2 py-2 rounded-full text-sm font-medium relative
         overflow-hidden transition-all duration-200 ease-in-out cursor-pointer select-none
         ${isActive ? 'bg-primary-light' : 'hover:bg-[#e4ecf7]'}`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className="w-8 flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ color: isActive ? '#1a73e8' : '#5f6368' }}
          >
            <SidebarIcon name={item.icon} />
          </span>
          <span
            className="truncate transition-all duration-200 ease-in-out"
            style={{
              color: isActive ? '#041e49' : '#5f6368',
              fontWeight: isActive ? 600 : 400,
              maxWidth: collapsed ? 0 : 180,
              opacity: collapsed ? 0 : 1,
              marginLeft: collapsed ? 0 : 8,
              flex: collapsed ? '0 1 0%' : '1 1 auto',
            }}
          >
            {label}
          </span>
          {item.badge != null && item.badge > 0 && (
            collapsed ? (
              <span
                className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                style={{ background: '#d93025' }}
              />
            ) : (
              <span
                className="text-xs text-white rounded-full min-w-[18px] h-[18px] flex-shrink-0
                           flex items-center justify-center px-1 font-medium"
                style={{ background: '#d93025' }}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )
          )}
        </>
      )}
    </NavLink>
  )
}

export default function AppSidebar() {
  const { t: tc } = useTranslation()
  const { sidebarItems } = useModulesStore()
  const { sidebarOpen, sidebarCollapsed, sidebarWidth, setSidebarWidth, headerHidden } = useUiStore()
  const { configs } = useSidebarStore()
  const { pathname } = useLocation()
  const isMobile = useIsMobile()

  // Horizontal resize (desktop, expanded only). Tracked in a ref during the drag so
  // pointer moves don't re-render on every frame; the store (and its per-module
  // persistence) is written continuously so the width survives a reload mid-drag too.
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; w: number } | null>(null)

  const onResizeDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragStart.current = { x: e.clientX, w: useUiStore.getState().sidebarWidth }
    setDragging(true)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }, [])

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    const s = dragStart.current
    if (!s) return
    setSidebarWidth(s.w + (e.clientX - s.x))   // store clamps to [MIN, MAX]
  }, [setSidebarWidth])

  const endResize = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return
    dragStart.current = null
    setDragging(false)
    // Releasing an already-lost capture throws in some engines, and this also runs
    // from `onLostPointerCapture` where the capture is gone by definition.
    try { (e.target as Element).releasePointerCapture?.(e.pointerId) } catch { /* already released */ }
  }, [])

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

  // Resize only when expanded AND on desktop (mobile is a full-width drawer).
  const resizable = !collapsed && !isMobile
  // Inline width overrides the `w-64` class only in that case; collapsed keeps the
  // `w-16` rail and mobile keeps the `w-64` drawer.
  const widthStyle = resizable ? { width: sidebarWidth } : undefined

  return (
    // Conteneur : l'aside clippe son contenu (pas de scrollbar horizontale), et la
    // poignée de redimensionnement vit EN DEHORS de lui, dans la gouttière à droite →
    // elle ne recouvre plus la scrollbar du corps de module. `contents` en mobile pour
    // rester neutre (l'aside est un tiroir `fixed`) ; boîte flex positionnée en desktop
    // (largeur = celle de l'aside → `left-full` = son bord droit).
    <div className="contents lg:relative lg:flex lg:flex-shrink-0">
    <aside
      data-module={activeConfig?.moduleId}
      data-app-sidebar
      data-app-chrome
      className={`
        fixed left-0 bottom-0 flex flex-col overflow-x-hidden overflow-y-hidden
        z-50 ${dragging ? '' : 'transition-all duration-200 ease-in-out'}
        lg:relative lg:translate-x-0 lg:z-auto lg:rounded-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'w-16' : 'w-64'}
        top-16 lg:top-auto
      `}
      style={{ background: 'var(--body-bg)', ...widthStyle }}
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
      {/* UN SEUL élément qui MORPHE entre la pilule (déplié) et le disque de 48px
          (replié), au lieu de deux blocs conditionnels qui claquaient. Astuce
          d'animation : hauteur/rayon constants (stade → cercle à 48px de large),
          largeur = celle du CONTENU → le bouton rétrécit tout seul en douceur quand
          le libellé replie sa largeur/opacité/marge et que le padding tombe à 0.
          `px-2` constant → à 48px de large, le disque est centré dans le rail de 64. */}
      {showNewButton && (
        <div className="flex items-center px-2" style={{ height: 72 }}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              {/* Anchor, never a <button>: the whole left panel is links. It only
                  opens a menu, so href='#' + preventDefault. */}
              <a
                href="#"
                role="button"
                onClick={e => e.preventDefault()}
                aria-label={newButtonLabel}
                className="inline-flex items-center bg-white text-sm font-medium
                           text-text-primary cursor-pointer overflow-hidden
                           transition-all duration-200 ease-in-out"
                style={{
                  // Expanded = the original pill (60px tall, radius 20); collapsed =
                  // a 48px disc. HEIGHT, radius and (right-)padding all tween, so the
                  // button visibly grows/shrinks — not just its width.
                  height: collapsed ? 48 : 60,
                  minWidth: 48,
                  // NO left padding, and the icon lives in a fixed 48px box (= the
                  // collapsed disc width): its centre stays at the same x whether
                  // expanded or collapsed, so the « + » DOES NOT slide sideways during
                  // the tween — and it lines up with the menu icons below (all at the
                  // rail's centre). Only the right side (label) extends.
                  paddingRight: collapsed ? 0 : 20,
                  border: '1px solid #e0e0e0',
                  borderRadius: collapsed ? 24 : 20,
                  boxShadow: collapsed
                    ? '0 1px 3px rgba(60,64,67,0.3), 0 4px 8px rgba(60,64,67,0.15)'
                    : '0 1px 3px rgba(0,0,0,0.12)',
                }}
              >
                <span className="flex items-center justify-center flex-shrink-0" style={{ width: 48, height: '100%' }}>
                  <PlusIcon />
                </span>
                <span
                  className="whitespace-nowrap transition-all duration-200 ease-in-out"
                  style={{
                    maxWidth: collapsed ? 0 : 150,
                    opacity: collapsed ? 0 : 1,
                  }}
                >
                  {newButtonLabel}
                </span>
              </a>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side={collapsed ? 'right' : 'bottom'}
                align="start"
                sideOffset={collapsed ? 8 : 4}
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

      {/* ── Corps de la sidebar ────────────────────────────────────────── */}
      {/* Le SidebarBody du module est rendu dans LES DEUX états (replié/déplié) en
          lui passant `collapsed`, pour que la nav reste identique — au lieu de
          retomber sur la liste générique quand replié. */}
      {activeConfig?.SidebarBody && (!collapsed || activeConfig.collapsedBody) ? (
        <activeConfig.SidebarBody collapsed={collapsed} />
      ) : (
        <>
          <nav className="flex-1 space-y-0.5 px-2">
            {mainItems.map((item) => (
              <SidebarLink key={item.id} item={item} collapsed={collapsed} />
            ))}
          </nav>

          {secondaryItems.length > 0 && (
            <>
              <div className="mx-3 my-2 h-px bg-border" />
              <nav className="space-y-0.5 px-2">
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

      {/* Le repli desktop est désormais piloté par le hamburger de l'en-tête
          (AppHeader), placé avant le logo façon Gmail. */}
    </aside>

    {/* Poignée de redimensionnement — DANS LA GOUTTIÈRE, à droite du bord (hors de
        l'aside) : sa zone de préhension démarre au bord droit et s'étend vers la
        droite, donc elle ne recouvre plus la scrollbar du corps de module. Style
        « office » : pastille à grip qui se MATÉRIALISE à l'approche de la souris. */}
    {resizable && (
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={tc('shell.resize_sidebar', { defaultValue: 'Redimensionner le panneau' })}
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        /* Safety net: a capture lost for any other reason (window blur, the node being
           re-parented) would otherwise leave the sidebar stuck in the dragging state —
           blue line, and no collapse animation any more. */
        onLostPointerCapture={endResize}
        className="hidden lg:block absolute top-0 left-full h-full w-3 z-[60] cursor-col-resize group"
      >
        {/* Trait vertical — discret au repos, teinté au survol/glissement. */}
        <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[5px] rounded-full transition-colors
                        ${dragging ? 'bg-primary' : 'bg-transparent group-hover:bg-border'}`} />
        {/* Pastille à grip (façon office) — invisible au repos, apparaît à l'approche. */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center
                        h-9 w-3.5 rounded-full bg-surface-0 border shadow-sm transition
                        ${dragging
                          ? 'opacity-100 bg-primary-light text-primary border-primary/40'
                          : 'opacity-0 group-hover:opacity-100 text-text-tertiary border-border'}`}>
          <GripVertical size={13} />
        </div>
      </div>
    )}
    </div>
  )
}

/* Plus sign for the "New" button. `currentColor` on purpose: the icon then follows the
 * button's own text colour, including on tinted or dark shells. */
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="2"  x2="10" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="2"  y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
