import { create } from 'zustand'
import type React from 'react'

export interface SearchConfig {
  moduleId:        string
  // Préfixe de route qui active cette config (ex: '/files', '/calendar')
  // Le préfixe le plus long gagne (most-specific wins)
  routePrefix:     string
  // Texte affiché dans le champ quand ce module est actif
  placeholder:     string
  // Clé i18n (ex: 'agenda:search_ph') résolue réactivement par la SearchBar.
  // Prioritaire sur `placeholder` ; permet la traduction au changement de langue.
  placeholderKey?: string
  // Appelé à chaque frappe dans le champ de recherche core
  onSearch?:       (query: string) => void
  // Remplacement complet de la SearchBar — le module contrôle toute l'UI de recherche
  // Si absent, on utilise le champ par défaut avec le placeholder ci-dessus
  SearchComponent?: React.ComponentType
  // Contenu du dropdown de filtres (injected par le module actif)
  // Rendu dans le panneau qui s'ouvre sous la searchbar
  FilterPanel?: React.ComponentType<{ onClose: () => void }>
  // Recherche par image : si défini, la SearchBar affiche un bouton appareil photo
  // qui ouvre un sélecteur d'image et appelle ce callback (images similaires).
  onImageSearch?: (file: File) => void
}

interface SearchState {
  configs:   SearchConfig[]
  register:  (config: SearchConfig) => void
  unregister: (moduleId: string) => void
}

export const useSearchStore = create<SearchState>((set) => ({
  configs: [],

  register: (config) =>
    set((s) => ({
      configs: [...s.configs.filter((c) => c.moduleId !== config.moduleId), config],
    })),

  unregister: (moduleId) =>
    set((s) => ({
      configs: s.configs.filter((c) => c.moduleId !== moduleId),
    })),
}))

// Trouve la config active selon le pathname courant.
// Plus le préfixe est long, plus il est spécifique → il gagne.
export function resolveSearchConfig(
  configs: SearchConfig[],
  pathname: string,
): SearchConfig | null {
  return (
    configs
      .filter((c) => pathname === c.routePrefix || pathname.startsWith(c.routePrefix + '/'))
      .sort((a, b) => b.routePrefix.length - a.routePrefix.length)[0] ?? null
  )
}
