import { create } from 'zustand'
import type React from 'react'

export interface SidebarConfig {
  moduleId:        string
  // Préfixe de route qui active cette config (most-specific wins)
  routePrefix:     string
  // Label du bouton "Nouveau" — ex: "Créer"
  newButtonLabel?: string
  // Clé i18n (ex: 'agenda:create') résolue réactivement par AppSidebar.
  // Prioritaire sur `newButtonLabel` ; permet la traduction au changement de langue.
  newButtonLabelKey?: string
  // Contenu du dropdown Nouveau/Créer — remplace le slot sidebar-new-actions
  NewActions?:     React.ComponentType
  // Corps entier de la sidebar (nav + footer) — remplace la nav par défaut.
  // Reçoit `collapsed` : le module rend sa nav en icônes seules quand replié,
  // pour que la navigation soit IDENTIQUE en mode replié et déplié.
  SidebarBody?:    React.ComponentType<{ collapsed?: boolean }>
  // true → le SidebarBody gère le mode replié (icônes) ; il est alors rendu AUSSI
  // quand la sidebar est repliée. false/absent → repli = nav générique par défaut.
  collapsedBody?:  boolean
  // true → la sidebar AppSidebar est masquée ; le module gère sa propre nav interne
  hideSidebar?:    boolean
}

interface SidebarState {
  configs:   SidebarConfig[]
  register:  (config: SidebarConfig) => void
  unregister: (moduleId: string) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  configs: [],
  register: (config) =>
    set((s) => ({
      configs: [...s.configs.filter((c) => c.moduleId !== config.moduleId), config],
    })),
  unregister: (moduleId) =>
    set((s) => ({ configs: s.configs.filter((c) => c.moduleId !== moduleId) })),
}))

// Trouve la config la plus spécifique pour le pathname courant
export function resolveActiveSidebarConfig(
  configs: SidebarConfig[],
  pathname: string,
): SidebarConfig | null {
  return (
    configs
      .filter((c) => pathname === c.routePrefix || pathname.startsWith(c.routePrefix + '/'))
      .sort((a, b) => b.routePrefix.length - a.routePrefix.length)[0] ?? null
  )
}
