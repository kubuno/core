/**
 * The design page in **project** mode for module projects: built into `@kubuno/host-runtime` (`npm run
 * build:design-host`, `--mode project` → `dist/project/design-page.js`) together with the host's shared modules
 * (`dist/project/shared/*`), so that the page and the module's code share one instance of each. The package's
 * `dist/project/entry.js` (`packages/host-runtime/src/entry.js`, served untouched by the module's dev server) loads
 * the page's stylesheet, calls `startModuleDesign` with an `importModule` of its own, and wires Vite's HMR.
 */
import './bootstrap';
import { type ProjectDesignOptions } from './project';
import type { DesignSurface } from './surface';
export type { DesignSurface };
/** Starts the design surface of a module project. */
export declare function startModuleDesign(importModule: ProjectDesignOptions['importModule']): DesignSurface;
