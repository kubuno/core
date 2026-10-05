/**
 * The design page in **project** (dev-server) mode: served by the project's own Vite dev server at
 * `/__kubuno_design__/` (`@kubuno/views-compiler`'s plugin, `kubuno.views.json` → `design.entry`). The registries
 * and user controls come from `/__kubuno_design__/project.json`; the project's controls and the view's
 * code-behind are imported through the dev server (HMR keeps them current).
 */
import './bootstrap'
import uiPackage from '../../../packages/ui/package.json'
import wasmUrl from '../../../packages/views-compiler/wasm/kubuno-views-web.wasm?url'
import { startSurface, type ProjectInfo } from './surface'

const DESIGN_PATH = '/__kubuno_design__/'

const surface = startSurface({
  mode: 'project',
  uiVersion: uiPackage.version,
  hostRuntime: null,
  wasmUrl,
  themesBase: `${DESIGN_PATH}themes`,
  loadProject: async () => {
    const r = await fetch(`${DESIGN_PATH}project.json`, { cache: 'no-store' })
    if (!r.ok) throw new Error(`${DESIGN_PATH}project.json: HTTP ${r.status}`)
    return (await r.json()) as ProjectInfo
  },
  importModule: (specifier) => import(/* @vite-ignore */ specifier) as Promise<Record<string, unknown>>,
})

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', (payload) => {
    void surface.modulesUpdated(payload.updates.map((u) => u.path))
  })
}
