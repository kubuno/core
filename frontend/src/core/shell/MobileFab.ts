/**
 * Code-behind of `MobileFab.kbview` (converted from `MobileFab.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useLocation } from "react-router-dom"
import { useIsMobile, useIsLandscape } from "@ui"
import { useSidebarStore, resolveActiveSidebarConfig } from "../store/sidebarStore"
import { useWaffleApps } from "./useWaffleApps"

import { ViewBase } from './MobileFab.kbview'
import * as __parts from './MobileFab.parts'

export class MobileFab extends ViewBase {
  @bind accessor open = false
  pathname!: string
  configs!: MobileFabStores['configs']
  isMobileVp!: boolean
  isLandscapeVp!: boolean
  allWaffleApps!: MobileFabStores['allWaffleApps']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { pathname } = useLocation()
    const { configs } = useSidebarStore()
    const isMobileVp = useIsMobile()
    const isLandscapeVp = useIsLandscape()
    const allWaffleApps = useWaffleApps()
    return { pathname, configs, isMobileVp, isLandscapeVp, allWaffleApps }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ pathname: s.pathname, configs: s.configs, isMobileVp: s.isMobileVp, isLandscapeVp: s.isLandscapeVp, allWaffleApps: s.allWaffleApps })
  }

  get landscape(): boolean {
    return this.isMobileVp && this.isLandscapeVp
  }

  get activeConfig() {
    return this.memo('activeConfig', [this.configs, this.pathname], () => resolveActiveSidebarConfig(this.configs, this.pathname))
  }

  get immersive(): boolean {
    return !!this.activeConfig?.hideSidebar
  }

  get show_case_1() {
    return !!(this.allWaffleApps.length === 0)
  }

  get show_main() {
    return !(this.allWaffleApps.length === 0)
  }

  get part1_props() {
    return this.memo('part1_props', [this.open, this.landscape, this.immersive, this.allWaffleApps, this.memo], () => {
      if (!(!(this.allWaffleApps.length === 0))) return undefined as never
      return ({ open: this.open, landscape: this.landscape, immersive: this.immersive, allWaffleApps: this.allWaffleApps, setOpen: this.memo("setOpen:bound", [], () => this.setOpen.bind(this)) })
    })
  }

  /** A part of the screen still written in React (<div> with a computed style). */
  get Part1() {
    if (!(!(this.allWaffleApps.length === 0))) return undefined as never
    return __parts.Part1
  }

  get visible() {
    return this.memo('visible', [this.open, this.show_main], () => this.open && this.show_main)
  }

  /** `setOpen` of the TSX: a value, or an update of the previous one. */
  setOpen(value: MobileFab['open'] | ((prev: MobileFab['open']) => MobileFab['open'])) {
    this.open = typeof value === 'function' ? (value as (prev: MobileFab['open']) => MobileFab['open'])(this.open) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type MobileFabStores = ReturnType<MobileFab['useStores']>

export default MobileFab.component()
