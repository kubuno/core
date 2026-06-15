import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { ContextMenuProvider } from './ContextMenuProvider'
import { useToolbarStore, resolveToolbarConfig } from '../store/toolbarStore'

export default function ModuleArea() {
  const { pathname } = useLocation()
  const { configs }  = useToolbarStore()
  const toolbarConfig = resolveToolbarConfig(configs, pathname)
  const Toolbar       = toolbarConfig?.ToolbarComponent ?? null
  // Identifiant du module actif (1er segment d'URL) → thème par module via CSS
  // (ex: [data-module="calendar"] surcharge --color-primary).
  const moduleId = pathname.split('/').filter(Boolean)[0] || 'home'

  return (
    <div data-module={moduleId} className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white rounded-xl">
      {Toolbar && (
        <div className="flex-shrink-0 bg-white">
          <Toolbar />
        </div>
      )}

      <ContextMenuProvider>
        {toolbarConfig?.noPadding
          ? (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <Outlet />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6"><Outlet /></div>
            </div>
          )}
      </ContextMenuProvider>
    </div>
  )
}
