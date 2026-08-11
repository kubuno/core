/**
 * The installed modules, as the administration console reads them.
 *
 * ── One inventory, three readers ─────────────────────────────────────────────
 * The sidebar submenu, the module list and one module's page all describe the
 * same set. They share ONE query key so a toggle made on the page is reflected
 * in the menu without either knowing about the other — and so the browser makes
 * one request, not three.
 *
 * ── Live, without polling ────────────────────────────────────────────────────
 * A module can appear, disappear or fall over while the console is open, and
 * the core already says so: `ModuleRegistered`, `ModuleUnregistered` and
 * `ModuleHealthChanged` reach the browser over the existing WebSocket (see
 * `websocket/hub.rs`). We invalidate on those three rather than poll — the
 * event is already there, and a timer would only add latency and traffic.
 *
 * Two things that channel forces us to be careful about:
 *
 *  • It is broadcast to EVERY signed-in client, not just administrators. So the
 *    subscription is installed only for a caller holding `core.modules.read`;
 *    otherwise an ordinary user would answer a module restart with a burst of
 *    403s on `/admin/modules`.
 *  • A socket that drops loses every event it was not there for. So a
 *    reconnection (`connected` going false → true) resynchronises as well:
 *    without it, a module installed during the outage would stay invisible
 *    until the next full page load.
 */
export { groupsOf, type ModuleSettingGroup } from './settings/moduleSettingSchema';
import type { ModuleSettingGroup } from './settings/moduleSettingSchema';
/** One row of `GET /api/v1/admin/modules`. */
export interface AdminModule {
    id: string;
    display_name: string;
    version: string;
    description: string | null;
    is_enabled: boolean;
    installed_at: string;
    /** The module's own USER settings page — never its administration surface. */
    settings_path: string | null;
    /**
     * Lucide name of the module's glyph — the icon of its entry point, the same
     * one the shell and the waffle menu show. Served with the inventory so a
     * module that is stopped or switched off still has a face: those are the rows
     * an operator most needs to recognise.
     */
    icon?: string | null;
    /**
     * The pages this module's panel is split into, in menu order.
     *
     * Served WITH the inventory rather than fetched per module: the navigation
     * tree grafts every module's groups under it, and asking each module in turn
     * would mean one round trip per installed module just to draw a menu.
     */
    setting_groups?: ModuleSettingGroup[];
}
/** The single cache key of the installed-module inventory. */
export declare const ADMIN_MODULES_KEY: readonly ["admin-modules"];
/**
 * The installed modules, kept in step with the instance in real time.
 *
 * Returns an idle query (no request, no data) when the caller may not read
 * modules — every consumer therefore renders its "nothing to show" branch
 * rather than a refusal.
 */
export declare function useAdminModules(): import("@tanstack/react-query").UseQueryResult<NoInfer<AdminModule[]>, Error>;
/**
 * What a module is doing right now, as three states that must not be merged.
 *
 *  • `disabled`    — an administrator switched it off. A decision, not a fault.
 *  • `unreachable` — it is switched ON and no instance has registered. That is
 *                    an incident: its pages do not open and nobody was told.
 *  • `running`     — enabled, and an instance is serving it.
 *  • `unknown`     — the live registry has not loaded yet. Reported as such so
 *                    that the first second after a page load does not paint
 *                    every module as broken.
 */
export type ModuleLiveState = 'disabled' | 'unreachable' | 'running' | 'unknown';
/**
 * Reads the live state from the registry the shell already holds
 * (`GET /api/v1/modules`, refreshed on the very same lifecycle events by
 * `main.tsx`) — no extra request, and no privilege beyond being signed in.
 */
export declare function useModuleLiveState(): (module: AdminModule) => ModuleLiveState;
/** i18n key of a live state, for a chip or a menu row title. */
export declare const LIVE_STATE_KEY: Record<ModuleLiveState, string>;
interface ToggleResult {
    id: string;
    is_enabled: boolean;
    also_disabled: string[];
}
/**
 * Enables or disables a module, optimistically.
 *
 * The flip is applied to the cache before the request leaves — the toggle must
 * not wait on a round trip — and rolled back if the server refuses. Callers add
 * their own `onSuccess`/`onError` at `mutate()` time (React Query runs both).
 */
export declare function useToggleModule(): import("@tanstack/react-query").UseMutationResult<ToggleResult, Error, {
    id: string;
    is_enabled: boolean;
}, {
    previous: AdminModule[] | undefined;
}>;
