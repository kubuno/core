/**
 * Code-behind of `ShellSidebar.kbcontrol` (converted from `Sidebar.tsx` by @kubuno/views-migrate).
 */
import { useLocation } from "react-router-dom"
import { useModulesStore } from "../../store/modulesStore"
import { useUiStore } from "../../store/uiStore"
import { useSidebarStore, resolveActiveSidebarConfig } from "../../store/sidebarStore"
import { WaffleAppRegistry } from "../../registry/WaffleAppRegistry"
import { Slot, SlotRegistry } from "../../slots/SlotRegistry"
import type { SidebarItem } from "../../types"

import { ViewBase } from './ShellSidebar.kbcontrol'
import * as __parts from './ShellSidebar.parts.tsx'
import { ModuleRootIcon } from './ShellSidebar.parts.tsx'

export class ShellSidebar extends ViewBase {
  pathname!: string
  activeModules!: SidebarStores['activeModules']
  configs!: SidebarStores['configs']
  sidebarOpen!: boolean
  closeSidebar!: () => void

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { pathname } = useLocation()
    const { activeModules } = useModulesStore()
    const { configs } = useSidebarStore()
    const { sidebarOpen, closeSidebar } = useUiStore()
    return { pathname, activeModules, configs, sidebarOpen, closeSidebar }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ pathname: s.pathname, activeModules: s.activeModules, configs: s.configs, sidebarOpen: s.sidebarOpen, closeSidebar: s.closeSidebar })
  }

  get activeConfig() {
    return this.memo('activeConfig', [this.configs, this.pathname], () => resolveActiveSidebarConfig(this.configs, this.pathname))
  }

  get activeModule() {
    return this.memo('activeModule', [this.activeModules, this.activeConfig], () => {
      const activeConfig = this.activeConfig
      return activeConfig
    ? this.activeModules.find((m) => m.module_id === activeConfig.moduleId)
    : null
    })
  }

  get moduleItems(): SidebarItem[] {
    return this.memo('moduleItems', [this.activeModule], () => [...(this.activeModule?.sidebar_items ?? [])].sort(
    (a, b) => a.position - b.position,
  ))
  }

  get moduleRootItems(): (SidebarItem & { _moduleId: string; })[] {
    return this.memo('moduleRootItems', [this.activeModules], () => this.activeModules
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
    .sort((a, b) => a!.position - b!.position) as (SidebarItem & { _moduleId: string })[])
  }

  get hasNewActions(): boolean {
    const activeConfig = this.activeConfig
    return activeConfig != null &&
    SlotRegistry.getSlot('sidebar-new-actions').some(
      (entry) => entry.moduleId === activeConfig.moduleId,
    )
  }

  get aside_class() {
    return `fixed left-0 top-14 bottom-0 w-64 bg-white flex flex-col py-3 overflow-y-auto
                  z-50 transition-transform duration-200 ease-in-out
                  ${this.sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                  lg:translate-x-0`
  }

  get show_active_config() {
    return this.memo('show_active_config', [this.activeConfig], () => !!(this.activeConfig))
  }

  get show_not_active_config() {
    return this.memo('show_not_active_config', [this.activeConfig], () => !(this.activeConfig))
  }

  get part1_props() {
    return this.memo('part1_props', [this.closeSidebar, this.activeConfig], () => {
      if (!(this.activeConfig)) return undefined as never
      return ({ closeSidebar: this.closeSidebar })
    })
  }

  /** A part of the screen still written in React (<NavLink> is no .kbview element (react-router-dom#NavLink)). */
  get Part1() {
    if (!(this.activeConfig)) return undefined as never
    return __parts.Part1
  }

  get show_active_config_sidebar_body() {
    return this.memo('show_active_config_sidebar_body', [this.activeConfig], () => {
      if (!(this.activeConfig)) return undefined as never
      return !!(this.activeConfig.SidebarBody)
    })
  }

  get show_not_active_config_sidebar_body() {
    return this.memo('show_not_active_config_sidebar_body', [this.activeConfig], () => {
      if (!(this.activeConfig)) return undefined as never
      return !(this.activeConfig.SidebarBody)
    })
  }

  get part2_props() {
    return this.memo('part2_props', [this.activeConfig], () => {
      if (!(this.activeConfig) || !(this.activeConfig.SidebarBody)) return undefined as never
      return ({ ActiveConfig_SidebarBody: this.activeConfig?.SidebarBody })
    })
  }

  /** A part of the screen still written in React (<activeConfig.SidebarBody> is no .kbview element (a local or dynamic component)). */
  get Part2() {
    if (!(this.activeConfig) || !(this.activeConfig.SidebarBody)) return undefined as never
    return __parts.Part2
  }

  get part3_props() {
    return this.memo('part3_props', [this.activeConfig, this.hasNewActions], () => {
      if (!(this.activeConfig) || !(!(this.activeConfig.SidebarBody)) || !(this.hasNewActions)) return undefined as never
      return ({ activeConfig: this.activeConfig })
    })
  }

  /** A part of the screen still written in React (<DropdownMenu.Root> is no .kbview element (a local or dynamic component)). */
  get Part3() {
    if (!(this.activeConfig) || !(!(this.activeConfig.SidebarBody)) || !(this.hasNewActions)) return undefined as never
    return __parts.Part3
  }

  /** `<SidebarLink>`, rendered by a ReactHost. */
  get SidebarLink() {
    if (!(this.activeConfig) || !(!(this.activeConfig.SidebarBody))) return undefined as never
    return __parts.SidebarLink
  }

  /** The rows of the Repeater over `moduleItems`. */
  get rows_module_items() {
    return this.memo('rows_module_items', [this.moduleItems, this.activeConfig], () => {
      if (!(this.activeConfig) || !(!(this.activeConfig.SidebarBody))) return undefined as never
      return this.moduleItems.map((item) => {
      return { item, sidebar_link_props: ((this.activeConfig) && (!(this.activeConfig.SidebarBody))) ? ({ item: item }) : undefined, key: item.id }
    })
    })
  }

  get visible() {
    return this.memo('visible', [this.hasNewActions, this.show_not_active_config_sidebar_body, this.activeConfig], () => {
      if (!(this.activeConfig)) return undefined as never
      return this.hasNewActions && this.show_not_active_config_sidebar_body
    })
  }

  get visible2() {
    return this.memo('visible2', [this.show_active_config_sidebar_body, this.show_active_config], () => this.show_active_config_sidebar_body && this.show_active_config)
  }

  get visible3() {
    return this.memo('visible3', [this.visible, this.show_active_config], () => this.visible && this.show_active_config)
  }

  get visible4() {
    return this.memo('visible4', [this.show_not_active_config_sidebar_body, this.show_active_config], () => this.show_not_active_config_sidebar_body && this.show_active_config)
  }

  /** `<SidebarLink>`, rendered by a ReactHost. */
  get SidebarLink2() {
    if (!(!(this.activeConfig))) return undefined as never
    return __parts.SidebarLink
  }

  get sidebar_link_props() {
    return this.memo('sidebar_link_props', [this.activeConfig], () => {
      if (!(!(this.activeConfig))) return undefined as never
      return ({ item: { id: 'home', label: 'Accueil', icon: 'Home', path: '/', position: 0 } })
    })
  }

  get show_module_root_items() {
    if (!(!(this.activeConfig))) return undefined as never
    return this.moduleRootItems.length > 0
  }

  /** The rows of the Repeater over `moduleRootItems`. */
  get rows_module_root_items() {
    return this.memo('rows_module_root_items', [this.moduleRootItems, this.activeConfig], () => {
      if (!(!(this.activeConfig))) return undefined as never
      return this.moduleRootItems.map((item) => {
      return { item, sidebar_link_props: ((!(this.activeConfig))) ? ({ item: item, iconOverride: <ModuleRootIcon moduleId={item._moduleId} item={item} /> }) : undefined, key: item.id }
    })
    })
  }

  /** `<Slot>`, rendered by a ReactHost. */
  get Slot() {
    return Slot
  }

  get slot_props() {
    return this.memo('slot_props', [], () => ({ name: "sidebar-storage" }))
  }

  get slot_props2() {
    return this.memo('slot_props2', [], () => ({ name: "sidebar-footer" }))
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type SidebarStores = ReturnType<ShellSidebar['useStores']>

export default ShellSidebar.component()
