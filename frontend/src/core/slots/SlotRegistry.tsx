import React from 'react'
import { useModulesStore } from '../store/modulesStore'

// Core reserves these well-known slot names. Modules may use any string as a slot
// name for inter-module contributions (e.g. "files-open-with") — those are defined
// and consumed entirely within module code, not in the core.
export type SlotName =
  // Core shell slots
  | 'sidebar-new-actions'
  | 'topbar-actions'
  | 'settings-sections'
  | 'admin-panels'
  | 'search-providers'
  | 'user-menu-items'
  | 'dashboard-widgets'
  | 'dashboard-stats-cards'
  | 'context-menu-items'
  | 'sidebar-storage'
  | 'help-menu-items'
  | 'header-search'
  | 'header-actions-right'
  | 'sidebar-footer'
  | 'module-toolbar'
  | 'left-rail-icons'
  | 'right-rail-icons'
  | 'app-dialogs'
  | 'global-services'
  | (string & Record<never, never>) // allow module-defined slot names without losing autocomplete

interface SlotEntry {
  moduleId: string
  Component: React.ComponentType
  /** Prédicat optionnel d'applicabilité. Quand il est fourni, le consommateur du
   *  slot peut filtrer les contributeurs qui ne s'appliquent pas à un contexte
   *  donné (ex. « files-open-with » : ne garder que les modules capables d'ouvrir
   *  le fichier visé). L'argument est défini par le consommateur du slot. */
  match?: (arg?: unknown) => boolean
}

interface OverrideEntry {
  moduleId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>
}

const registry  = new Map<SlotName, SlotEntry[]>()
const overrides = new Map<string, OverrideEntry>()

export const SlotRegistry = {
  register(slot: SlotName, moduleId: string, Component: React.ComponentType, match?: (arg?: unknown) => boolean) {
    if (!registry.has(slot)) registry.set(slot, [])
    registry.get(slot)!.push({ moduleId, Component, match })
  },

  getSlot(slot: SlotName): SlotEntry[] {
    return registry.get(slot) ?? []
  },

  // Register a component that replaces a built-in component from another module.
  // The replacement is only used when `moduleId` appears in the active modules list.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOverride(key: string, moduleId: string, Component: React.ComponentType<any>) {
    overrides.set(key, { moduleId, Component })
  },

  // Returns the override component if its owning module is active, otherwise null.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getActiveOverride<T = Record<string, unknown>>(key: string, activeIds: Set<string>): React.ComponentType<T> | null {
    const entry = overrides.get(key)
    if (!entry || !activeIds.has(entry.moduleId)) return null
    return entry.Component as React.ComponentType<T>
  },

  unregisterModule(moduleId: string) {
    for (const [slot, entries] of registry) {
      registry.set(slot, entries.filter((e) => e.moduleId !== moduleId))
    }
    for (const [key, entry] of overrides) {
      if (entry.moduleId === moduleId) overrides.delete(key)
    }
  },
}

interface SlotProps {
  name: SlotName
  fallback?: React.ReactNode
}

export function Slot({ name, fallback }: SlotProps) {
  const activeModules = useModulesStore(s => s.activeModules)
  const activeIds = new Set(activeModules.map(m => m.module_id))

  const entries = SlotRegistry.getSlot(name).filter(e => activeIds.has(e.moduleId))
  if (entries.length === 0) return <>{fallback}</>
  return (
    <>
      {entries.map(({ moduleId, Component }) => (
        <Component key={moduleId} />
      ))}
    </>
  )
}
