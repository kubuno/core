/**
 * Code-behind of `ScopeStatusPill.kbview` (converted from `ScopeStatusPill.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import type { ResolvedSetting } from "./scopeTypes"
import { inheritanceOf } from "./moduleScope"

import { ViewBase } from './ScopeStatusPill.kbview'
import * as __parts from './ScopeStatusPill.parts'

export interface ScopeStatusPillProps {
  /** Resolved state of the setting at the scope on screen. */
  resolved?: ResolvedSetting
  /** The page is showing an organisational unit rather than the whole instance. */
  scoped:    boolean
  /**
   * The module declared this setting instance-wide: it has no per-unit meaning,
   * and the row is read-only while a unit is selected.
   */
  instanceOnly: boolean
}

export class ScopeStatusPill extends ViewBase {
  tr!: ScopeStatusPillStores['t']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    return { t }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t })
  }

  get state() {
    if (!(!(this.props.instanceOnly))) return undefined as never
    return inheritanceOf(this.props.resolved)
  }

  get count(): number {
    if (!(!(this.props.instanceOnly)) || !(!!(!this.props.scoped))) return undefined as never
    return this.props.resolved?.overrides.length ?? 0
  }

  get show_case_1() {
    return !!(this.props.instanceOnly)
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.props], () => {
      if (!(this.props.instanceOnly)) return undefined as never
      return ({ t: this.tr })
    })
  }

  /** A part of the screen still written in React (<Pill> is no .kbview element (a local or dynamic component)). */
  get Part1() {
    if (!(this.props.instanceOnly)) return undefined as never
    return __parts.Part1
  }

  get show_case_2() {
    return !(this.props.instanceOnly) && !!((!this.props.scoped) && (this.count === 0))
  }

  get show_case_3() {
    return !(this.props.instanceOnly) && !((!this.props.scoped) && (this.count === 0)) && !!(!this.props.scoped)
  }

  get part2_props() {
    return this.memo('part2_props', [this.tr, this.count, this.props], () => {
      if (!(!(this.props.instanceOnly)) || !(!((!this.props.scoped) && (this.count === 0))) || !(!this.props.scoped)) return undefined as never
      return ({ t: this.tr, count: this.count })
    })
  }

  /** A part of the screen still written in React (<Pill> is no .kbview element (a local or dynamic component)). */
  get Part2() {
    if (!(!(this.props.instanceOnly)) || !(!((!this.props.scoped) && (this.count === 0))) || !(!this.props.scoped)) return undefined as never
    return __parts.Part2
  }

  get show_case_4() {
    return !(this.props.instanceOnly) && !((!this.props.scoped) && (this.count === 0)) && !(!this.props.scoped) && !!(this.state === 'locked')
  }

  get part3_props() {
    return this.memo('part3_props', [this.tr, this.props, this.count, this.state], () => {
      if (!(!(this.props.instanceOnly)) || !(!((!this.props.scoped) && (this.count === 0))) || !(!(!this.props.scoped)) || !(this.state === 'locked')) return undefined as never
      return ({ t: this.tr, resolved: this.props.resolved })
    })
  }

  /** A part of the screen still written in React (<Pill> is no .kbview element (a local or dynamic component)). */
  get Part3() {
    if (!(!(this.props.instanceOnly)) || !(!((!this.props.scoped) && (this.count === 0))) || !(!(!this.props.scoped)) || !(this.state === 'locked')) return undefined as never
    return __parts.Part3
  }

  get show_case_5() {
    return !(this.props.instanceOnly) && !((!this.props.scoped) && (this.count === 0)) && !(!this.props.scoped) && !(this.state === 'locked') && !!(this.state === 'own')
  }

  get part4_props() {
    return this.memo('part4_props', [this.tr, this.props, this.count, this.state], () => {
      if (!(!(this.props.instanceOnly)) || !(!((!this.props.scoped) && (this.count === 0))) || !(!(!this.props.scoped)) || !(!(this.state === 'locked')) || !(this.state === 'own')) return undefined as never
      return ({ t: this.tr })
    })
  }

  /** A part of the screen still written in React (<Pill> is no .kbview element (a local or dynamic component)). */
  get Part4() {
    if (!(!(this.props.instanceOnly)) || !(!((!this.props.scoped) && (this.count === 0))) || !(!(!this.props.scoped)) || !(!(this.state === 'locked')) || !(this.state === 'own')) return undefined as never
    return __parts.Part4
  }

  get show_main() {
    return !(this.props.instanceOnly) && !((!this.props.scoped) && (this.count === 0)) && !(!this.props.scoped) && !(this.state === 'locked') && !(this.state === 'own')
  }

  get part5_props() {
    return this.memo('part5_props', [this.tr, this.props, this.count, this.state], () => {
      if (!(!(this.props.instanceOnly)) || !(!((!this.props.scoped) && (this.count === 0))) || !(!(!this.props.scoped)) || !(!(this.state === 'locked')) || !(!(this.state === 'own'))) return undefined as never
      return ({ t: this.tr, resolved: this.props.resolved })
    })
  }

  /** A part of the screen still written in React (<Pill> is no .kbview element (a local or dynamic component)). */
  get Part5() {
    if (!(!(this.props.instanceOnly)) || !(!((!this.props.scoped) && (this.count === 0))) || !(!(!this.props.scoped)) || !(!(this.state === 'locked')) || !(!(this.state === 'own'))) return undefined as never
    return __parts.Part5
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type ScopeStatusPillStores = ReturnType<ScopeStatusPill['useStores']>

export default ScopeStatusPill.component()
