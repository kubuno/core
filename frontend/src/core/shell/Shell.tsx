import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { CollapseSidebarRegistry } from '../registry/CollapseSidebarRegistry'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import LeftRail from './LeftRail'
import ModuleArea from './ModuleArea'
import RightRail from './RightRail'
import RightPanel from './RightPanel'
import MobileNav from './MobileNav'
import MobileFab from './MobileFab'
import { useUiStore } from '../store/uiStore'
import { Slot } from '../slots/SlotRegistry'
import { useIdleLogout } from '../hooks/useIdleLogout'

export default function Shell() {
  const { sidebarOpen, closeSidebar, setSidebarCollapsed, headerHidden } = useUiStore()
  const location = useLocation()

  // Déconnexion automatique après inactivité (réglage admin).
  useIdleLogout()

  // Page d'accueil : tableau de bord pleine largeur, sans panneaux latéraux.
  const isHome = location.pathname === '/'

  useEffect(() => { closeSidebar() }, [location.pathname, closeSidebar])

  // Apps PaintSharp/Office (déclarées dans CollapseSidebarRegistry) : replier la sidebar
  // à l'ENTRÉE pour gagner de la largeur, la restaurer à la SORTIE. On ne réagit
  // qu'aux transitions entrée/sortie → un repli/dépli manuel reste respecté tant
  // qu'on navigue à l'intérieur du groupe.
  const wasCollapsedScope = useRef(false)
  useEffect(() => {
    const inScope = CollapseSidebarRegistry.matches(location.pathname)
    if (inScope && !wasCollapsedScope.current) setSidebarCollapsed(true)
    else if (!inScope && wasCollapsedScope.current) setSidebarCollapsed(false)
    wasCollapsedScope.current = inScope
  }, [location.pathname, setSidebarCollapsed])

  return (
    <div data-app-shell className="h-screen flex flex-col overflow-hidden" style={{ height: '100dvh', background: 'var(--body-bg)' }}>
      {/* Header global pleine largeur — masqué quand un sous-module héberge la
          recherche + les actions dans sa propre barre de titre. */}
      {!headerHidden && <AppHeader />}

      {/* Corps : fond #f1f4f8 visible entre les zones comme séparateur. La marge
          basse mobile réserve la place de la barre de navigation fixe. */}
      <div data-app-body className="flex flex-1 overflow-hidden gap-1 p-1 pb-14 lg:pb-1">
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            data-app-chrome
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {!isHome && <AppSidebar />}

        {!isHome && (
          <div data-app-chrome className="hidden lg:flex flex-shrink-0">
            <LeftRail />
          </div>
        )}

        <ModuleArea />

        {!isHome && (
          <div data-app-chrome className="hidden lg:flex flex-shrink-0">
            <RightPanel />
            <RightRail />
          </div>
        )}
      </div>

      <MobileFab />
      <MobileNav />

      {/* Dialogs globaux (portals, zéro-coût quand fermés) */}
      <Slot name="app-dialogs" />
      {/* Effets globaux des modules (composants invisibles : WS, listeners…) */}
      <Slot name="global-services" />

    </div>
  )
}
