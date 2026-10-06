/**
 * The design page in **project** mode for module projects: built into `@kubuno/host-runtime` (`npm run
 * build:design-host`, `--mode project` → `dist/project/design-page.js`) together with the host's shared modules
 * (`dist/project/shared/*`), so that the page and the module's code share one instance of each. The package's
 * `dist/project/entry.js` (`packages/host-runtime/src/entry.js`, served untouched by the module's dev server) loads
 * the page's stylesheet, calls `startModuleDesign` with an `importModule` of its own, and wires Vite's HMR.
 */
import './bootstrap'
import hostRuntimePackage from '../../../packages/host-runtime/package.json'
import wasmUrl from '../../../packages/views-compiler/wasm/kubuno-views-web.wasm?url'
import { startProjectSurface, type ProjectDesignOptions } from './project'
import type { DesignSurface } from './surface'

export type { DesignSurface }

/** Starts the design surface of a module project. */
export function startModuleDesign(importModule: ProjectDesignOptions['importModule']): DesignSurface {
  return startProjectSurface({ hostRuntime: hostRuntimePackage.version, wasmUrl, importModule })
}
