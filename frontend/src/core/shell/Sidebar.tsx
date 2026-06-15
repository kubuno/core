import { useLocation, NavLink } from 'react-router-dom'
import { Plus, ChevronLeft } from 'lucide-react'
import { getIcon } from '../utils/iconMap'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useModulesStore } from '../store/modulesStore'
import { useUiStore } from '../store/uiStore'
import { useSidebarStore, resolveActiveSidebarConfig } from '../store/sidebarStore'
import { WaffleAppRegistry } from '../registry/WaffleAppRegistry'
import { Slot, SlotRegistry } from '../slots/SlotRegistry'
import type { SidebarItem } from '../types'

function SidebarIcon({ name }: { name: string }) {
  const Icon = getIcon(name)
  return <Icon size={20} />
}

/** Résout l'icône d'une entrée racine de module via WaffleAppRegistry en priorité. */
function ModuleRootIcon({ moduleId, item }: { moduleId: string; item: SidebarItem }) {
  const entry = WaffleAppRegistry.get(moduleId)
  if (entry) {
    const app = entry.apps.find(a => a.path === item.path) ?? entry.apps[0]
    if (app) return <app.Icon size={20} />
  }
  return <SidebarIcon name={item.icon} />
}

function SidebarLink({ item, iconOverride }: { item: SidebarItem; iconOverride?: React.ReactNode }) {
  const { closeSidebar } = useUiStore()
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={closeSidebar}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium relative
         transition-all cursor-pointer select-none
         ${isActive
           ? 'bg-primary-light text-primary'
           : 'text-text-secondary hover:bg-surface-2'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'}>
            {iconOverride ?? <SidebarIcon name={item.icon} />}
          </span>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className="text-xs bg-danger text-white rounded-full min-w-[18px] h-[18px]
                             flex items-center justify-center px-1 font-medium">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const { activeModules } = useModulesStore()
  const { configs } = useSidebarStore()
  const { sidebarOpen, closeSidebar } = useUiStore()

  // Which module (if any) is the user currently inside?
  const activeConfig = resolveActiveSidebarConfig(configs, pathname)

  // Running instance for the active module (has its sidebar_items)
  const activeModule = activeConfig
    ? activeModules.find((m) => m.module_id === activeConfig.moduleId)
    : null

  // Items shown when inside a module
  const moduleItems = [...(activeModule?.sidebar_items ?? [])].sort(
    (a, b) => a.position - b.position,
  )

  // One root item per running module for the default view (lowest position = entry point)
  // - Label from WaffleAppRegistry (module display name like "Office", not sub-item like "Documents")
  // - Icon from WaffleAppRegistry (single source of truth, same as waffle menu)
  const moduleRootItems = activeModules
    .map((m) => {
      const sorted = [...m.sidebar_items].sort((a, b) => a.position - b.position)
      const first = sorted[0]
      if (!first) return null
      const waffleLabel = WaffleAppRegistry.get(m.module_id)?.label
      return {
        ...first,
        label:     waffleLabel ?? first.label,
        _moduleId: m.module_id,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a!.position - b!.position) as (SidebarItem & { _moduleId: string })[]

  // "New" button only shown when a module with new-actions is active
  const hasNewActions =
    activeConfig != null &&
    SlotRegistry.getSlot('sidebar-new-actions').some(
      (entry) => entry.moduleId === activeConfig.moduleId,
    )

  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 w-64 bg-white flex flex-col py-3 overflow-y-auto
                  z-50 transition-transform duration-200 ease-in-out
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                  lg:translate-x-0`}
      style={{ borderRight: '1px solid #dadce0' }}
    >
      {activeConfig ? (
        /* ── INSIDE A MODULE ──────────────────────────────────────── */
        <>
          {/* Back to home */}
          <div className="px-3 mb-1">
            <NavLink
              to="/"
              onClick={closeSidebar}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-sm
                         text-text-secondary hover:bg-surface-2 transition-colors"
            >
              <ChevronLeft size={16} />
              <span>Accueil</span>
            </NavLink>
          </div>

          {/* Module provides its own full sidebar body */}
          {activeConfig.SidebarBody ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              <activeConfig.SidebarBody />
            </div>
          ) : (
            <>
              {/* Module "New" button — only if module registered new-actions */}
              {hasNewActions && (
                <div className="px-3 mb-3">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-2xl text-sm font-medium
                                   text-text-primary border border-border shadow-sm hover:shadow-md
                                   transition-shadow w-full"
                      >
                        <Plus size={18} className="text-text-secondary" />
                        {activeConfig.newButtonLabel ?? 'Nouveau'}
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        side="bottom"
                        align="start"
                        sideOffset={4}
                        className="min-w-48 bg-white rounded-[5px] shadow-lg border border-border py-1 z-50"
                      >
                        <Slot
                          name="sidebar-new-actions"
                          fallback={
                            <div className="px-3 py-2 text-xs text-text-tertiary">
                              Aucune action disponible
                            </div>
                          }
                        />
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              )}

              {/* Module navigation items */}
              <nav className="flex-1 px-3 space-y-0.5">
                {moduleItems.map((item) => (
                  <SidebarLink key={item.id} item={item} />
                ))}
              </nav>
            </>
          )}
        </>
      ) : (
        /* ── DEFAULT VIEW: module list ────────────────────────────── */
        <nav className="flex-1 px-3 space-y-0.5">
          {/* Core: home */}
          <SidebarLink
            item={{ id: 'home', label: 'Accueil', icon: 'Home', path: '/', position: 0 }}
          />

          {/* One entry per running module — icon from WaffleAppRegistry for consistency */}
          {moduleRootItems.length > 0 && (
            <div className="mx-0 my-2 h-px bg-border" />
          )}
          {moduleRootItems.map((item) => (
            <SidebarLink
              key={item.id}
              item={item}
              iconOverride={<ModuleRootIcon moduleId={item._moduleId} item={item} />}
            />
          ))}
        </nav>
      )}

      {/* Persistent footer slots (storage gauge, etc.) */}
      <Slot name="sidebar-storage" />
      <Slot name="sidebar-footer" />

      {/* Lien Administration déplacé dans le menu du compte (UserPanel). */}
    </aside>
  )
}
