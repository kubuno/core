import type { ActiveModule, SidebarItem } from '../types';
interface ModulesState {
    activeModules: ActiveModule[];
    sidebarItems: SidebarItem[];
    isLoading: boolean;
    /** `false` until the FIRST load of the modules has finished. On a hard
     *  reload of a module route (F5 on /drive), the UI bundles are loaded at run
     *  time, asynchronously: while this flag is false the router must NOT show a
     *  404 (the module's route is not registered yet) but a loading screen. */
    modulesReady: boolean;
    /** Incremented each time a module bundle is loaded at run time. Components
     *  reading non-reactive registries (RouteRegistry) subscribe to it to render
     *  again once the module's routes are registered. */
    loadedVersion: number;
    fetchModules: () => Promise<void>;
}
export declare const useModulesStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ModulesState>>;
export {};
