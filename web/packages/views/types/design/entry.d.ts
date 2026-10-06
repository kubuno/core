/**
 * The design page in **project** (dev-server) mode for the core itself: served by the core's own Vite dev server at
 * `/__kubuno_design__/` (`@kubuno/views-compiler`'s plugin, `kubuno.views.json` → `design.entry`). The registries
 * and user controls come from `/__kubuno_design__/project.json`; the project's controls and the view's code-behind
 * are imported through the dev server (HMR keeps them current). Module projects get the same page from
 * `@kubuno/host-runtime` (`entry.module.ts`).
 */
import './bootstrap';
