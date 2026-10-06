/**
 * Code-behind of `Shell.kbview` (converted from `Shell.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views'
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import AppHeader from "./AppHeader"
import AppSidebar from "./AppSidebar"
import TitleTooltips from "./TitleTooltips"
import LeftRail from "./LeftRail"
import ModuleArea from "./ModuleArea"
import RightRail from "./RightRail"
import RightPanel from "./RightPanel"
import MobileNav from "./MobileNav"
import MobileFab from "./MobileFab"
import { useIsMobile, useIsLandscape } from "@ui"
import { useUiStore } from "../store/uiStore"
import { useSidebarStore, resolveActiveSidebarConfig } from "../store/sidebarStore"
import { Slot } from "../slots/SlotRegistry"
import { useMaintenanceNotices } from "./useMaintenanceNotices"
import { useIdleLogout } from "../hooks/useIdleLogout"
import { usePanelStatePersistence } from "../hooks/usePanelStatePersistence"
import { useAppNavMemory } from "../hooks/useAppNavMemory"
import { setRouterNavigate } from "../navigation"
import GlobalMaintenanceBanner from "./GlobalMaintenanceBanner"

import { ViewBase } from './Shell.kbview'

export class Shell extends ViewBase {
  sidebarOpen!: boolean
  closeSidebar!: () => void
  headerHidden!: boolean
  location!: ShellStores['location']
  isMobileVp!: boolean
  isLandscapeVp!: boolean
  sidebarConfigs!: ShellStores['sidebarConfigs']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { sidebarOpen, closeSidebar, headerHidden } = useUiStore()
    const location = useLocation()
    const routerNavigate = useNavigate()
    useEffect(() => {
      setRouterNavigate(routerNavigate)
      return () => setRouterNavigate(null)
    }, [routerNavigate])
    useIdleLogout()
    useMaintenanceNotices()
    useEffect(() => {
      const snapBack = () => {
        const se = document.scrollingElement
        if (se && (se.scrollTop !== 0 || se.scrollLeft !== 0)) {
          se.scrollTop = 0
          se.scrollLeft = 0
        }
      }
      snapBack()
      window.addEventListener('scroll', snapBack)
      return () => window.removeEventListener('scroll', snapBack)
    }, [])
    usePanelStatePersistence()
    useAppNavMemory()
    const isMobileVp = useIsMobile()
    const isLandscapeVp = useIsLandscape()
    const sidebarConfigs = useSidebarStore(s => s.configs)
    useEffect(() => { closeSidebar() }, [location.pathname, closeSidebar])
    return { sidebarOpen, closeSidebar, headerHidden, location, routerNavigate, isMobileVp, isLandscapeVp, sidebarConfigs }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ sidebarOpen: s.sidebarOpen, closeSidebar: s.closeSidebar, headerHidden: s.headerHidden, location: s.location, isMobileVp: s.isMobileVp, isLandscapeVp: s.isLandscapeVp, sidebarConfigs: s.sidebarConfigs })
  }

  get isHome(): boolean {
    return this.location.pathname === '/'
  }

  get mobileLandscape(): boolean {
    return this.isMobileVp && this.isLandscapeVp
  }

  get activeSidebarCfg() {
    return this.memo('activeSidebarCfg', [this.sidebarConfigs, this.location], () => resolveActiveSidebarConfig(this.sidebarConfigs, this.location.pathname))
  }

  get hasBottomNav(): boolean {
    return !this.activeSidebarCfg?.hideSidebar && !!this.activeSidebarCfg?.mobileTabs?.length
  }

  /** `<TitleTooltips>`, rendered by a ReactHost. */
  get TitleTooltips() {
    return TitleTooltips
  }

  get show_header_hidden() {
    return !this.headerHidden
  }

  /** `<AppHeader>`, rendered by a ReactHost. */
  get AppHeader() {
    return AppHeader
  }

  /** `<GlobalMaintenanceBanner>`, rendered by a ReactHost. */
  get GlobalMaintenanceBanner() {
    return GlobalMaintenanceBanner
  }

  /** `<MobileNav>`, rendered by a ReactHost. */
  get MobileNav() {
    if (!(this.mobileLandscape)) return undefined as never
    return MobileNav
  }

  get mobile_nav_props() {
    return this.memo('mobile_nav_props', [this.mobileLandscape], () => {
      if (!(this.mobileLandscape)) return undefined as never
      return ({ variant: "rail" })
    })
  }

  get show_is_home() {
    return !this.isHome
  }

  /** `<AppSidebar>`, rendered by a ReactHost. */
  get AppSidebar() {
    return AppSidebar
  }

  /** `<LeftRail>`, rendered by a ReactHost. */
  get LeftRail() {
    return LeftRail
  }

  /** `<ModuleArea>`, rendered by a ReactHost. */
  get ModuleArea() {
    return ModuleArea
  }

  /** `<RightPanel>`, rendered by a ReactHost. */
  get RightPanel() {
    return RightPanel
  }

  /** `<RightRail>`, rendered by a ReactHost. */
  get RightRail() {
    return RightRail
  }

  get div_data() {
    return ["app-body", ((v: unknown) => (v === undefined || v === null ? '' : "has-bottom-nav=" + String(v)))(!this.mobileLandscape && this.hasBottomNav ? '' : undefined)].filter(Boolean).join('; ')
  }

  /** `<MobileFab>`, rendered by a ReactHost. */
  get MobileFab() {
    return MobileFab
  }

  get show_mobile_landscape() {
    return !this.mobileLandscape
  }

  /** `<MobileNav>`, rendered by a ReactHost. */
  get MobileNav2() {
    return MobileNav
  }

  /** `<Slot>`, rendered by a ReactHost. */
  get Slot() {
    return Slot
  }

  get slot_props() {
    return this.memo('slot_props', [], () => ({ name: "app-dialogs" }))
  }

  get slot_props2() {
    return this.memo('slot_props2', [], () => ({ name: "global-services" }))
  }

  panel_click(_sender: unknown, _args: MouseEventArgs) {
    if (!(this.sidebarOpen)) return undefined as never
    this.closeSidebar()
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type ShellStores = ReturnType<Shell['useStores']>

export default Shell.component()
