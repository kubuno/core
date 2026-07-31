import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import TitleTooltips from './TitleTooltips'
import LeftRail from './LeftRail'
import ModuleArea from './ModuleArea'
import RightRail from './RightRail'
import RightPanel from './RightPanel'
import MobileNav from './MobileNav'
import MobileFab from './MobileFab'
import { useIsMobile, useIsLandscape } from '@ui'
import { useUiStore } from '../store/uiStore'
import { useSidebarStore, resolveActiveSidebarConfig } from '../store/sidebarStore'
import { Slot } from '../slots/SlotRegistry'
import { useIdleLogout } from '../hooks/useIdleLogout'
import { usePanelStatePersistence } from '../hooks/usePanelStatePersistence'
import { useAppNavMemory } from '../hooks/useAppNavMemory'

export default function Shell() {
  const { sidebarOpen, closeSidebar, headerHidden } = useUiStore()
  const location = useLocation()

  // Déconnexion automatique après inactivité (réglage admin).
  useIdleLogout()

  // Mémorise/restaure l'état (déplié/enroulé) des panneaux gauche et droit, par
  // application et par onglet (survit au F5 et au retour ultérieur). Couvre aussi
  // le repli par défaut des apps déclarées dans CollapseSidebarRegistry.
  usePanelStatePersistence()

  // Mémorise la dernière route de chaque application (par onglet) : quitter une
  // app puis y revenir via le lanceur ramène exactement où on l'avait laissée.
  useAppNavMemory()

  // Page d'accueil : tableau de bord pleine largeur, sans panneaux latéraux.
  const isHome = location.pathname === '/'

  // Téléphone en paysage : la barre de navigation du bas devient un rail
  // vertical à gauche (une barre du bas mangerait la hauteur déjà réduite).
  // ⚠️ Appeler les DEUX hooks inconditionnellement : `useIsMobile() && useIsLandscape()`
  // court-circuiterait `useIsLandscape` sur desktop → au franchissement du seuil
  // mobile le nombre de hooks change → React #310 (hooks rendus en plus/moins).
  const isMobileVp = useIsMobile()
  const isLandscapeVp = useIsLandscape()
  const mobileLandscape = isMobileVp && isLandscapeVp

  // La barre de navigation basse n'existe que si le module actif déclare des
  // mobileTabs (plus de barre générique Accueil/Modules/Paramètres) — le
  // padding bas n'est réservé que dans ce cas.
  const sidebarConfigs = useSidebarStore(s => s.configs)
  const activeSidebarCfg = resolveActiveSidebarConfig(sidebarConfigs, location.pathname)
  const hasBottomNav = !activeSidebarCfg?.hideSidebar && !!activeSidebarCfg?.mobileTabs?.length

  useEffect(() => { closeSidebar() }, [location.pathname, closeSidebar])

  return (
    <div data-app-shell className="h-screen flex flex-col overflow-hidden" style={{ height: '100dvh', background: 'var(--body-bg)' }}>
      {/* Native `title` attributes → the project's tooltip, app-wide. */}
      <TitleTooltips />
      {/* Header global pleine largeur — masqué quand un sous-module héberge la
          recherche + les actions dans sa propre barre de titre. */}
      {!headerHidden && <AppHeader />}

      {/* Corps : fond #f1f4f8 visible entre les zones comme séparateur. La marge
          basse mobile réserve la place de la barre de navigation fixe (sauf en
          paysage, où la nav passe à gauche, dans le flux). */}
      {/* data-has-bottom-nav : index.css réserve la hauteur de la barre + safe-area
          (règle !important) uniquement quand cet attribut est présent. */}
      <div data-app-body data-has-bottom-nav={!mobileLandscape && hasBottomNav ? '' : undefined}
           className="flex flex-1 overflow-hidden gap-1 lg:pb-1">
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            data-app-chrome
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Rail de navigation vertical (téléphone en paysage) */}
        {mobileLandscape && (
          <div data-app-chrome className="flex-shrink-0">
            <MobileNav variant="rail" />
          </div>
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
      {/* Barre du bas : uniquement en portrait (en paysage → rail à gauche). */}
      {!mobileLandscape && <MobileNav />}

      {/* Dialogs globaux (portals, zéro-coût quand fermés) */}
      <Slot name="app-dialogs" />
      {/* Effets globaux des modules (composants invisibles : WS, listeners…) */}
      <Slot name="global-services" />

    </div>
  )
}
