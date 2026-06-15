import type { ActiveModule, SidebarItem } from '../types';
interface ModulesState {
    activeModules: ActiveModule[];
    sidebarItems: SidebarItem[];
    isLoading: boolean;
    /** `false` jusqu'à ce que le PREMIER chargement des modules soit terminé.
     *  Sur un rechargement dur d'une route de module (F5 sur /drive), les bundles
     *  UI sont chargés à l'exécution de façon asynchrone : tant que ce flag est
     *  faux, le routeur ne doit PAS afficher 404 (la route du module n'est pas
     *  encore enregistrée) mais un écran de chargement. */
    modulesReady: boolean;
    /** Incrémenté chaque fois qu'un bundle de module est chargé à l'exécution.
     *  Les composants qui lisent des registries non-réactifs (RouteRegistry) s'y
     *  abonnent pour se re-rendre après l'enregistrement des routes du module. */
    loadedVersion: number;
    fetchModules: () => Promise<void>;
}
export declare const useModulesStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ModulesState>>;
export {};
