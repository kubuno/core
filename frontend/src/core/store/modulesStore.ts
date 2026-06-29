import { create } from 'zustand'
import { modulesApi } from '../api/modules'
import { loadRemoteModules } from '../modules/loadRemoteModules'
import type { ActiveModule, SidebarItem } from '../types'

// Le panneau de gauche n'a plus d'item par défaut : ni modules, ni « Accueil »
// (la home reste accessible via le logo). Le panneau ne s'affiche donc que
// lorsqu'un module fournit sa propre navigation ; sinon il est caché/enroulé.
const CORE_ITEMS: SidebarItem[] = []

interface ModulesState {
  activeModules: ActiveModule[]
  sidebarItems: SidebarItem[]
  isLoading: boolean
  /** `false` jusqu'à ce que le PREMIER chargement des modules soit terminé.
   *  Sur un rechargement dur d'une route de module (F5 sur /drive), les bundles
   *  UI sont chargés à l'exécution de façon asynchrone : tant que ce flag est
   *  faux, le routeur ne doit PAS afficher 404 (la route du module n'est pas
   *  encore enregistrée) mais un écran de chargement. */
  modulesReady: boolean
  /** Incrémenté chaque fois qu'un bundle de module est chargé à l'exécution.
   *  Les composants qui lisent des registries non-réactifs (RouteRegistry) s'y
   *  abonnent pour se re-rendre après l'enregistrement des routes du module. */
  loadedVersion: number

  fetchModules: () => Promise<void>
}

export const useModulesStore = create<ModulesState>((set) => ({
  activeModules: [],
  sidebarItems: CORE_ITEMS,
  isLoading: false,
  modulesReady: false,
  loadedVersion: 0,

  fetchModules: async () => {
    set({ isLoading: true })
    try {
      const { data } = await modulesApi.list()
      // Les modules ne sont plus affichés dans le panneau de gauche par défaut :
      // on garde uniquement les items du core. Les modules restent enregistrés
      // (`activeModules`) pour le routage et le chargement de leurs bundles UI.
      set({ activeModules: data.modules, sidebarItems: CORE_ITEMS })
      // Charge les bundles UI des modules à l'exécution (no-op pour ceux déjà
      // chargés). Bump loadedVersion si de nouvelles routes/slots sont apparus.
      const n = await loadRemoteModules(data.modules)
      if (n > 0) set((s) => ({ loadedVersion: s.loadedVersion + 1 }))
    } catch {
      // Garder les core items si l'API échoue
    } finally {
      set({ isLoading: false, modulesReady: true })
    }
  },
}))
