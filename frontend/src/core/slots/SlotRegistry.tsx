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
    settingsRoutes.delete(moduleId)
    for (let i = notifGroups.length - 1; i >= 0; i--) {
      if (notifGroups[i].moduleId === moduleId) notifGroups.splice(i, 1)
    }
  },
}

// ── Per-module settings (admin global + per-user) ───────────────────────────────
// Each module exposes up to two settings pages:
//   • admin → instance-wide settings, admin only      (default `/<moduleId>/settings`)
//   • user  → per-user settings + overrides           (default `/<moduleId>/user-settings`)
// The header gear button routes to the USER page whenever the user is inside that
// module's routes. Resolution is keyed by the CURRENT route's module (not a global
// slot), so it scales to every module.
interface SettingsRoutes {
  admin?: string
  user?:  string
}
const settingsRoutes = new Map<string, SettingsRoutes>()

function setRoute(moduleId: string, patch: SettingsRoutes) {
  settingsRoutes.set(moduleId, { ...settingsRoutes.get(moduleId), ...patch })
}

export const ModuleSettingsRegistry = {
  /** Legacy: declare the module's per-user settings route (default `/<moduleId>/settings`).
   *  Kept for modules not yet migrated to the admin/user split. */
  register(moduleId: string, route?: string) {
    setRoute(moduleId, { user: route ?? `/${moduleId}/settings` })
  },
  /** Declare the module's admin (instance-wide) settings route. */
  registerAdmin(moduleId: string, route?: string) {
    setRoute(moduleId, { admin: route ?? `/${moduleId}/settings` })
  },
  /** Declare the module's per-user settings route. */
  registerUser(moduleId: string, route?: string) {
    setRoute(moduleId, { user: route ?? `/${moduleId}/user-settings` })
  },
  /** Per-user settings route for `moduleId` if registered and active, else null.
   *  This is what the header gear button navigates to. */
  getRoute(moduleId: string | undefined, activeIds: Set<string>): string | null {
    if (!moduleId) return null
    const route = settingsRoutes.get(moduleId)?.user
    return route && activeIds.has(moduleId) ? route : null
  },
  /** Admin (instance-wide) settings route for `moduleId` if registered and active. */
  getAdminRoute(moduleId: string | undefined, activeIds: Set<string>): string | null {
    if (!moduleId) return null
    const route = settingsRoutes.get(moduleId)?.admin
    return route && activeIds.has(moduleId) ? route : null
  },
  /** Whether `pathname` is a registered settings page (full-bleed, no toolbar). */
  isSettingsRoute(pathname: string): boolean {
    for (const r of settingsRoutes.values()) {
      if (r.admin === pathname || r.user === pathname) return true
    }
    return false
  },
}

// ── Notification activity registry ──────────────────────────────────────────────
// Any module that emits notifications declares one or more activity groups; they
// are rendered as an E-mail/Push matrix in the core Settings → Notifications tab.
// The user's per-activity choices are stored in `users.preferences.notifications`.
export interface NotifActivity {
  /** Stable id, unique within the group. */
  id: string
  /** Human label (already translated; modules pass `t(..., { defaultValue })`). */
  label: string
  /** Default channel states when the user hasn't chosen yet. */
  emailDefault?: boolean
  pushDefault?: boolean
}
export interface NotifGroup {
  /** Owning module ('core' = always shown; others shown only when the module is active). */
  moduleId: string
  /** Group heading (e.g. "Tâches"). */
  title: string
  /** Sort order among groups (lower first; default 100). */
  order?: number
  activities: NotifActivity[]
}

const notifGroups: NotifGroup[] = []

export const NotificationRegistry = {
  /** Register (or replace, by moduleId+title) a notification activity group. */
  register(group: NotifGroup) {
    const i = notifGroups.findIndex(g => g.moduleId === group.moduleId && g.title === group.title)
    if (i >= 0) notifGroups[i] = group
    else notifGroups.push(group)
  },
  /** Groups to display: core groups always, module groups only when active. */
  getGroups(activeIds: Set<string>): NotifGroup[] {
    return notifGroups
      .filter(g => g.moduleId === 'core' || activeIds.has(g.moduleId))
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
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
