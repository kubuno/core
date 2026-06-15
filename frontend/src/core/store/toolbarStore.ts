import { create } from 'zustand'
import type React from 'react'

export interface ToolbarConfig {
  moduleId:          string
  // Préfixe de route (most-specific wins)
  routePrefix:       string
  ToolbarComponent?: React.ComponentType
  // true → supprime le p-6 du wrapper de contenu (modules full-bleed)
  noPadding?:        boolean
}

interface ToolbarState {
  configs:   ToolbarConfig[]
  register:  (config: ToolbarConfig) => void
  unregister: (moduleId: string) => void
}

export const useToolbarStore = create<ToolbarState>((set) => ({
  configs: [],
  register: (config) =>
    set((s) => ({
      configs: [...s.configs.filter((c) => c.moduleId !== config.moduleId), config],
    })),
  unregister: (moduleId) =>
    set((s) => ({ configs: s.configs.filter((c) => c.moduleId !== moduleId) })),
}))

export function resolveToolbarConfig(
  configs: ToolbarConfig[],
  pathname: string,
): ToolbarConfig | null {
  return (
    configs
      .filter((c) => pathname === c.routePrefix || pathname.startsWith(c.routePrefix + '/'))
      .sort((a, b) => b.routePrefix.length - a.routePrefix.length)[0] ?? null
  )
}
