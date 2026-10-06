/**
 * Code-behind of `AppSidebar.kbcontrol` (converted from `AppSidebar.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useCallback, useMemo, useRef } from "react"
import { useLocation } from "react-router-dom"
import { useMenuDropdown, useIsMobile } from "@ui"
import { useTranslation } from "react-i18next"
import { useModulesStore } from "../../store/modulesStore"
import { useUiStore } from "../../store/uiStore"
import { useSidebarStore, resolveActiveSidebarConfig } from "../../store/sidebarStore"
import { ExtensionRegistry } from "../../registry/ExtensionRegistry"
import { NEW_ACTIONS, type NewActionsProvider } from "../../registry/newActions"
import type { SidebarItem } from "../../types"

import { ViewBase } from './AppSidebar.kbcontrol'
import * as __parts from './AppSidebar.parts.tsx'

export class AppSidebar extends ViewBase {
  @bind accessor dragging = false
  tc!: AppSidebarStores['tc']
  sidebarItems!: SidebarItem[]
  sidebarOpen!: boolean
  sidebarCollapsed!: boolean
  sidebarWidth!: number
  headerHidden!: boolean
  configs!: AppSidebarStores['configs']
  pathname!: string
  isMobile!: boolean
  newMenu!: AppSidebarStores['newMenu']
  dragStart!: AppSidebarStores['dragStart']
  onResizeDown!: (e: React.PointerEvent) => void
  onResizeMove!: (e: React.PointerEvent) => void
  endResize!: (e: React.PointerEvent) => void
  loadedVersion!: number
  newProviders!: NewActionsProvider[]

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t: tc } = useTranslation()
    const { sidebarItems } = useModulesStore()
    const { sidebarOpen, sidebarCollapsed, sidebarWidth, setSidebarWidth, headerHidden } = useUiStore()
    const { configs } = useSidebarStore()
    const { pathname } = useLocation()
    const isMobile = useIsMobile()
    const newMenu = useMenuDropdown()
    const dragStart = useRef<{ x: number; w: number } | null>(null)
    const onResizeMove = useCallback((e: React.PointerEvent) => {
      const s = dragStart.current
      if (!s) return
      setSidebarWidth(s.w + (e.clientX - s.x))   // store clamps to [MIN, MAX]
    }, [setSidebarWidth])
    const loadedVersion = useModulesStore(s => s.loadedVersion)
    return { tc, sidebarItems, sidebarOpen, sidebarCollapsed, sidebarWidth, setSidebarWidth, headerHidden, configs, pathname, isMobile, newMenu, dragStart, onResizeMove, loadedVersion }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const dragStart = this.dragStart
    const loadedVersion = this.loadedVersion
    const onResizeDown = useCallback((e: React.PointerEvent) => {
      e.preventDefault()
      dragStart.current = { x: e.clientX, w: useUiStore.getState().sidebarWidth }
      this.dragging = true
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
    }, [])
    this.publish({ onResizeDown })
    const endResize = useCallback((e: React.PointerEvent) => {
      if (!dragStart.current) return
      dragStart.current = null
      this.dragging = false
      // Releasing an already-lost capture throws in some engines, and this also runs
      // from `onLostPointerCapture` where the capture is gone by definition.
      try { (e.target as Element).releasePointerCapture?.(e.pointerId) } catch { /* already released */ }
    }, [])
    this.publish({ endResize })
    const activeConfig = this.activeConfig
    const newProviders = useMemo(
      () => (activeConfig == null ? [] : ExtensionRegistry.getAll<NewActionsProvider>(NEW_ACTIONS)
        .filter(p => p.moduleId === activeConfig.moduleId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))),
      [activeConfig, loadedVersion],
    )
    this.publish({ newProviders })
    return { onResizeDown, endResize, newProviders }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tc: s.tc, sidebarItems: s.sidebarItems, sidebarOpen: s.sidebarOpen, sidebarCollapsed: s.sidebarCollapsed, sidebarWidth: s.sidebarWidth, headerHidden: s.headerHidden, configs: s.configs, pathname: s.pathname, isMobile: s.isMobile, newMenu: s.newMenu, dragStart: s.dragStart, onResizeMove: s.onResizeMove, loadedVersion: s.loadedVersion })
    const h = this.useHooks()
    this.publish({ onResizeDown: h.onResizeDown, endResize: h.endResize, newProviders: h.newProviders })
  }

  get activeConfig() {
    return this.memo('activeConfig', [this.configs, this.pathname], () => resolveActiveSidebarConfig(this.configs, this.pathname))
  }

  get moduleRoots(): Set<string> {
    return this.memo('moduleRoots', [this.configs], () => new Set(
    this.configs
      .map((c) => '/' + c.routePrefix.split('/').filter(Boolean)[0])
      .filter(Boolean)
  ))
  }

  get allMain(): SidebarItem[] {
    return this.memo('allMain', [this.sidebarItems], () => this.sidebarItems.filter((i) => i.section !== 'secondary'))
  }

  get allSecondary(): SidebarItem[] {
    return this.memo('allSecondary', [this.sidebarItems], () => this.sidebarItems.filter((i) => i.section === 'secondary'))
  }

  get mainItems(): SidebarItem[] {
    return this.memo('mainItems', [this.activeConfig, this.moduleRoots, this.allMain], () => this.filterItems(this.allMain))
  }

  get secondaryItems(): SidebarItem[] {
    return this.memo('secondaryItems', [this.activeConfig, this.moduleRoots, this.allSecondary], () => this.filterItems(this.allSecondary))
  }

  get showNewButton(): boolean {
    return this.newProviders.length > 0
  }

  get newButtonLabel(): string {
    return this.activeConfig?.newButtonLabelKey
    ? this.tc(this.activeConfig.newButtonLabelKey)
    : (this.activeConfig?.newButtonLabel ?? this.tc('shell.new'))
  }

  get bodyEmpty(): boolean {
    return !this.activeConfig?.SidebarBody && this.mainItems.length === 0 && this.secondaryItems.length === 0
  }

  get forceCollapsed(): boolean {
    if (!(!(this.activeConfig?.hideSidebar)) || !(!(this.bodyEmpty && !this.showNewButton))) return undefined as never
    return this.bodyEmpty && this.showNewButton
  }

  get collapsed(): boolean {
    if (!(!(this.activeConfig?.hideSidebar)) || !(!(this.bodyEmpty && !this.showNewButton))) return undefined as never
    return this.sidebarCollapsed || this.forceCollapsed
  }

  get resizable(): boolean {
    if (!(!(this.activeConfig?.hideSidebar)) || !(!(this.bodyEmpty && !this.showNewButton))) return undefined as never
    return !this.collapsed && !this.isMobile
  }

  get widthStyle(): { width: number; } | undefined {
    return this.memo('widthStyle', [this.resizable, this.sidebarWidth, this.activeConfig, this.bodyEmpty, this.showNewButton], () => {
      if (!(!(this.activeConfig?.hideSidebar)) || !(!(this.bodyEmpty && !this.showNewButton))) return undefined as never
      return this.resizable ? { width: this.sidebarWidth } : undefined
    })
  }

  get show_case_1() {
    return !!(this.activeConfig?.hideSidebar)
  }

  get show_case_2() {
    return !(this.activeConfig?.hideSidebar) && !!(this.bodyEmpty && !this.showNewButton)
  }

  get show_main() {
    return !(this.activeConfig?.hideSidebar) && !(this.bodyEmpty && !this.showNewButton)
  }

  get part1_props() {
    return this.memo('part1_props', [this.activeConfig, this.dragging, this.sidebarOpen, this.collapsed, this.widthStyle, this.headerHidden, this.showNewButton, this.newMenu, this.newButtonLabel, this.newProviders, this.mainItems, this.secondaryItems, this.bodyEmpty], () => {
      if (!(!(this.activeConfig?.hideSidebar)) || !(!(this.bodyEmpty && !this.showNewButton))) return undefined as never
      return ({ activeConfig: this.activeConfig, dragging: this.dragging, sidebarOpen: this.sidebarOpen, collapsed: this.collapsed, widthStyle: this.widthStyle, headerHidden: this.headerHidden, showNewButton: this.showNewButton, newMenu: this.newMenu, newButtonLabel: this.newButtonLabel, newProviders: this.newProviders, newMenu_pos: this.newMenu?.pos, ActiveConfig_SidebarBody: this.activeConfig?.SidebarBody, mainItems: this.mainItems, secondaryItems: this.secondaryItems })
    })
  }

  /** A part of the screen still written in React (<aside> with a computed style). */
  get Part1() {
    if (!(!(this.activeConfig?.hideSidebar)) || !(!(this.bodyEmpty && !this.showNewButton))) return undefined as never
    return __parts.Part1
  }

  get part2_props() {
    return this.memo('part2_props', [this.tc, this.onResizeDown, this.onResizeMove, this.endResize, this.dragging, this.activeConfig, this.bodyEmpty, this.showNewButton, this.resizable], () => {
      if (!(!(this.activeConfig?.hideSidebar)) || !(!(this.bodyEmpty && !this.showNewButton)) || !(this.resizable)) return undefined as never
      return ({ tc: this.tc, onResizeDown: this.onResizeDown, onResizeMove: this.onResizeMove, endResize: this.endResize, dragging: this.dragging })
    })
  }

  /** A part of the screen still written in React (<div aria-orientation onPointerDown onPointerMove onPointerUp onPointerCancel onLostPointerCapture>: attribute(s) without a .kbview property). */
  get Part2() {
    if (!(!(this.activeConfig?.hideSidebar)) || !(!(this.bodyEmpty && !this.showNewButton)) || !(this.resizable)) return undefined as never
    return __parts.Part2
  }

  filterItems(items: AppSidebar['allMain']) {
    if (!this.activeConfig) {
      return items.filter((i) => i.path === '/' || this.moduleRoots.has(i.path))
    }
    const prefix = this.activeConfig.routePrefix
    return items.filter((i) => i.path === prefix || i.path.startsWith(prefix + '/'))
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type AppSidebarStores = ReturnType<AppSidebar['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type AppSidebarHooks = ReturnType<AppSidebar['useHooks']>

export default AppSidebar.component()
