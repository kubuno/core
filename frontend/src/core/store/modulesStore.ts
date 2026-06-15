import { create } from 'zustand'
import { modulesApi } from '../api/modules'
import { loadRemoteModules } from '../modules/loadRemoteModules'
import type { ActiveModule, SidebarItem } from '../types'

const CORE_ITEMS: SidebarItem[] = [
  { id: 'home', label: 'Accueil', icon: 'Home', path: '/', position: 0 },
]

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
      const moduleItems = data.modules.flatMap((m) => m.sidebar_items)
      const all = [...CORE_ITEMS, ...moduleItems].sort((a, b) => a.position - b.position)
      set({ activeModules: data.modules, sidebarItems: all })
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
