/**
 * Code-behind of `BrandLink.kbcontrol` (converted from `BrandLink.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views'
import { useNavigate } from 'react-router-dom'
import { useLocation } from "react-router-dom"
import { WaffleAppRegistry } from "../../registry/WaffleAppRegistry"
import { useModulesStore } from "../../store/modulesStore"
import { InstanceLogo } from "./InstanceLogo"

import { ViewBase } from './BrandLink.kbcontrol'
import * as __parts from './BrandLink.parts.tsx'

export type BrandLinkProps = {
  collapsed?: boolean
  /** Logo edge in px: 32 in the top bar, 40 in the sidebar corner. */
  iconSize?: number
  className?: string
}

export class BrandLink extends ViewBase {
  pathname!: string
  navigate!: ReturnType<typeof useNavigate>
  rerender1?: unknown

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { pathname } = useLocation()
    return { pathname }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    this.rerender1 = useModulesStore((s) => s.loadedVersion)
    return {  }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ pathname: s.pathname })
    this.useHooks()
    this.navigate = useNavigate()
  }

  get collapsed() {
    return this.props.collapsed ?? false
  }

  get iconSize() {
    return this.props.iconSize ?? 32
  }

  get className() {
    return this.props.className ?? ''
  }

  /** Read again on every render, as the TSX did: modules register their apps late, and again with their names in a new language. */
  get hit() {
    return WaffleAppRegistry.resolveAppByPath(this.pathname)
  }

  get to(): string {
    return this.hit ? (this.hit.app.landing ?? this.hit.app.path) : '/'
  }

  get label(): string {
    return this.hit ? this.hit.app.label : 'Kubuno'
  }

  get Icon() {
    return this.memo('Icon', [this.hit, this.rerender1], () => this.hit?.app.Icon)
  }

  get show_icon() {
    return this.memo('show_icon', [this.Icon, this.rerender1], () => !!(this.Icon))
  }

  get show_not_icon() {
    return this.memo('show_not_icon', [this.Icon, this.rerender1], () => !(this.Icon))
  }

  get part1_props() {
    return this.memo('part1_props', [this.Icon, this.iconSize, this.rerender1], () => {
      if (!(this.Icon)) return undefined as never
      return ({ Icon: this.Icon, iconSize: this.iconSize })
    })
  }

  /** A part of the screen still written in React (<Icon> is no .kbview element (a local or dynamic component)). */
  get Part1() {
    if (!(this.Icon)) return undefined as never
    return __parts.Part1
  }

  /** `<InstanceLogo>`, rendered by a ReactHost. */
  get InstanceLogo() {
    if (!(!(this.Icon))) return undefined as never
    return InstanceLogo
  }

  get instance_logo_props() {
    return this.memo('instance_logo_props', [this.iconSize, this.Icon, this.rerender1], () => {
      if (!(!(this.Icon))) return undefined as never
      return ({ size: this.iconSize, className: "text-primary" })
    })
  }

  get show_collapsed() {
    return !this.collapsed
  }

  panel_click(_sender: unknown, _args: MouseEventArgs) {
    this.navigate(this.to)
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type BrandLinkStores = ReturnType<BrandLink['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type BrandLinkHooks = ReturnType<BrandLink['useHooks']>

export default BrandLink.component()
