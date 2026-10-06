/**
 * Code-behind of `LeftRail.kbview` (converted from `LeftRail.tsx` by @kubuno/views-migrate).
 */
import { useLeftRailStore } from "../store/leftRailStore"

import { ViewBase } from './LeftRail.kbview'
import * as __parts from './LeftRail.parts'

export class LeftRail extends ViewBase {
  entries!: LeftRailStores['entries']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { entries } = useLeftRailStore()
    return { entries }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ entries: s.entries })
  }

  get show_case_1() {
    return !!(this.entries.length === 0)
  }

  get show_main() {
    return !(this.entries.length === 0)
  }

  get part1_props() {
    return this.memo('part1_props', [this.entries], () => {
      if (!(!(this.entries.length === 0))) return undefined as never
      return ({ entries: this.entries })
    })
  }

  /** A part of the screen still written in React (a list callback destructuring its item). */
  get Part1() {
    if (!(!(this.entries.length === 0))) return undefined as never
    return __parts.Part1
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type LeftRailStores = ReturnType<LeftRail['useStores']>

export default LeftRail.component()
