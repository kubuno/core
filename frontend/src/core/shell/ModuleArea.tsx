import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { ThemeScopeContext } from '@ui'
import { ContextMenuProvider } from './ContextMenuProvider'
import { useToolbarStore, resolveToolbarConfig } from '../store/toolbarStore'
import { ModuleSettingsRegistry } from '../slots/SlotRegistry'

export default function ModuleArea() {
  const { pathname } = useLocation()
  const { configs }  = useToolbarStore()
  const toolbarConfig = resolveToolbarConfig(configs, pathname)
  // Per-user module settings pages render full-bleed (no padding) and without the
  // module toolbar — they own their chrome (breadcrumb + tab bar), like mail.
  const isSettings    = ModuleSettingsRegistry.isSettingsRoute(pathname)
  const noPadding     = isSettings || toolbarConfig?.noPadding
  const Toolbar       = isSettings ? null : (toolbarConfig?.ToolbarComponent ?? null)
  // Identifiant du module actif (1er segment d'URL) → thème par module via CSS
  // (ex: [data-module="calendar"] surcharge --color-primary).
  const moduleId = pathname.split('/').filter(Boolean)[0] || 'home'

  return (
    <ThemeScopeContext.Provider value={moduleId}>
    <div data-module={moduleId} className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white rounded-xl">
      {Toolbar && (
        <div className="flex-shrink-0 bg-white no-print">
          <Toolbar />
        </div>
      )}

      <ContextMenuProvider>
        {noPadding
          ? (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <Outlet />
            </div>
          ) : (
            // `flex flex-col` + `flex-1` on the inner wrapper → it has a defined
            // height (= the content area): an `h-full` child (a module StartPage,
            // say) fills it, while taller content overflows and scrolls through the
            // parent's `overflow-y-auto`.
            // No padding here: the shell never insets a module's content — a module
            // that wants breathing room adds it inside its own page.
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="flex-1 min-h-0"><Outlet /></div>
            </div>
          )}
      </ContextMenuProvider>
    </div>
    </ThemeScopeContext.Provider>
  )
}
