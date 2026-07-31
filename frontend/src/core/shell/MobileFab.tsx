import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useIsMobile, useIsLandscape } from '@ui'
import { useSidebarStore, resolveActiveSidebarConfig } from '../store/sidebarStore'
import { useModulesStore } from '../store/modulesStore'
import { WaffleAppRegistry } from '../registry/WaffleAppRegistry'
import WaffleMenu from './WaffleMenu'

/**
 * Floating action button (mobile only). On desktop the app launcher (waffle
 * menu) lives in the header; on mobile that header has no room for it and the
 * per-module bottom nav can't switch apps, so this FAB surfaces the waffle
 * app-launcher bottom-right, above the MobileNav. The module's "New" create
 * actions stay reachable through the off-canvas sidebar drawer.
 */
export default function MobileFab() {
  const { pathname } = useLocation()
  const { configs } = useSidebarStore()
  const { activeModules } = useModulesStore()
  // Landscape phones have no bottom bar (the nav is a left rail), so the FAB
  // drops to a normal bottom margin instead of clearing the 56px bar.
  // ⚠️ Call BOTH hooks unconditionally — `useIsMobile() && useIsLandscape()`
  // short-circuits the second hook on desktop, so crossing the mobile
  // breakpoint changes the hook count → React #310.
  const isMobileVp = useIsMobile()
  const isLandscapeVp = useIsLandscape()
  const landscape = isMobileVp && isLandscapeVp
  // The launcher's open state (from Radix). Backdrop + FAB z-index follow it
  // directly — no animation, so both flip instantly.
  // (declared before the early returns to keep hook order stable.)
  const [open, setOpen] = useState(false)

  const activeConfig = resolveActiveSidebarConfig(configs, pathname)
  // Le lanceur d'apps est GLOBAL : il reste visible même dans les éditeurs
  // immersifs (hideSidebar masque la nav basse et le tiroir, pas le waffle).
  // Dans ces éditeurs, une barre de commandes occupe souvent le bord bas
  // (ruban mobile Office) : en paysage on garde alors la surélévation.
  const immersive = !!activeConfig?.hideSidebar

  // Toutes les apps du waffle (mêmes données que la grille d'apps de l'en-tête) :
  // on rattache moduleId/moduleLabel pour le regroupement des sous-modules.
  const allWaffleApps = activeModules.flatMap((m) => {
    const entry = WaffleAppRegistry.get(m.module_id)
    return entry ? entry.apps.map(a => ({ ...a, moduleId: entry.moduleId, moduleLabel: entry.label })) : []
  })
  if (allWaffleApps.length === 0) return null

  return (
    <>
      {/* When the launcher is open, blur/dim everything behind it so only the
          panel and this FAB stay sharp. z-[9998] sits below the FAB wrapper
          (z-[9999]) and the panel Content (z-[9999], portaled) → both stay
          clear; everything else (topbar, list, bottom nav) is behind → blurred.
          Tapping it dismisses via Radix's outside-pointer handling. */}
      {open && (
        // Blur + dim behind the launcher. The filter is set INLINE (not via a
        // CSS class) because the CSS minifier strips the standard
        // `backdrop-filter` and keeps only `-webkit-backdrop-filter`, which
        // modern Chrome no longer honours on its own → dim-but-no-blur.
        <div aria-hidden data-app-chrome className="lg:hidden fixed inset-0 z-[9998]"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.1)' }} />
      )}
      {/* z-[44] fermé : AU-DESSUS des overlays plein-module des éditeurs (backstage
          Office, z-40 — sinon le lanceur global disparaît sur leurs pages d'accueil)
          mais SOUS leurs barres/palettes de commandes (z-45+). */}
      <div
        data-app-chrome
        className={`lg:hidden fixed right-4 ${open ? 'z-[9999]' : 'z-[44]'}`}
        style={{ bottom: landscape && !immersive ? 'calc(16px + env(safe-area-inset-bottom))' : 'calc(72px + env(safe-area-inset-bottom))' }}
      >
        <WaffleMenu allApps={allWaffleApps} fab onOpenChange={setOpen} />
      </div>
    </>
  )
}
