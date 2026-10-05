/**
 * The design page in **project** (dev-server) mode: served by the project's own Vite dev server at
 * `/__kubuno_design__/` (`@kubuno/views-compiler`'s plugin, `kubuno.views.json` → `design.entry`). The registries
 * and user controls come from `/__kubuno_design__/project.json`; the project's controls and the view's
 * code-behind are imported through the dev server (HMR keeps them current).
 */
import './bootstrap';
