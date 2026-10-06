/**
 * Code-behind of `MobileNav.kbcontrol` (converted from `MobileNav.tsx` by @kubuno/views-migrate).
 */
import { Fragment } from 'react'
import { useLocation } from "react-router-dom"
import { useSidebarStore, resolveActiveSidebarConfig, type MobileNavTab } from "../../store/sidebarStore"

import { ViewBase } from './MobileNav.kbcontrol'
import * as __parts from './MobileNav.parts.tsx'
import { NavItem } from './MobileNav.parts.tsx'

export type MobileNavProps = { variant?: 'bottom' | 'rail' }

export class MobileNav extends ViewBase {
  pathname!: string
  configs!: MobileNavStores['configs']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { pathname } = useLocation()
    const configs = useSidebarStore(s => s.configs)
    return { pathname, configs }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ pathname: s.pathname, configs: s.configs })
  }

  get variant() {
    return this.props.variant ?? 'bottom'
  }

  get active() {
    return this.memo('active', [this.configs, this.pathname], () => resolveActiveSidebarConfig(this.configs, this.pathname))
  }

  get tabs(): MobileNavTab[] | undefined {
    return this.memo('tabs', [this.active], () => {
      if (!(!(this.active?.hideSidebar))) return undefined as never
      return this.active?.mobileTabs
    })
  }

  get items() {
    return this.memo('items', [this.tabs, this.variant, this.active], () => {
      if (!(!(this.active?.hideSidebar)) || !(!(!this.tabs?.length))) return undefined as never
      return this.tabs.map(tab => <NavItem key={tab.id} tab={tab} rail={this.variant === 'rail'} />)
    })
  }

  get show_case_1() {
    return !!(this.active?.hideSidebar)
  }

  get show_case_2() {
    return !(this.active?.hideSidebar) && !!(!this.tabs?.length)
  }

  get show_case_3() {
    return !(this.active?.hideSidebar) && !(!this.tabs?.length) && !!(this.variant === 'rail')
  }

  /** `React.Fragment`: renders the elements an expression holds. */
  get Fragment() {
    return Fragment
  }

  get content_items() {
    return this.memo('content_items', [this.items, this.active, this.tabs, this.variant], () => {
      if (!(!(this.active?.hideSidebar)) || !(!(!this.tabs?.length)) || !(this.variant === 'rail')) return undefined as never
      return ({ children: this.items })
    })
  }

  get show_main() {
    return !(this.active?.hideSidebar) && !(!this.tabs?.length) && !(this.variant === 'rail')
  }

  get content_items2() {
    return this.memo('content_items2', [this.items, this.active, this.tabs, this.variant], () => {
      if (!(!(this.active?.hideSidebar)) || !(!(!this.tabs?.length)) || !(!(this.variant === 'rail'))) return undefined as never
      return ({ children: this.items })
    })
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type MobileNavStores = ReturnType<MobileNav['useStores']>

export default MobileNav.component()
