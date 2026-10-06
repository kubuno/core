/**
 * Code-behind of `MobileSettingsIndex.kbcontrol` (converted from `MobileSettingsIndex.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Slot } from "../slots/SlotRegistry"
import { useSettingsNav } from "./navigation"

import { ViewBase } from './MobileSettingsIndex.kbcontrol'
import * as __parts from './MobileSettingsIndex.parts'

export class MobileSettingsIndex extends ViewBase {
  tr!: MobileSettingsIndexStores['t']
  navigate!: MobileSettingsIndexStores['navigate']
  nav!: MobileSettingsIndexStores['nav']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const nav = useSettingsNav()
    return { t, navigate, nav }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, navigate: s.navigate, nav: s.nav })
  }

  get part1_props() {
    return this.memo('part1_props', [this.nav, this.navigate, this.tr], () => ({ nav: this.nav, navigate: this.navigate, t: this.tr }))
  }

  /** A part of the screen still written in React (a list callback destructuring its item). */
  get Part1() {
    return __parts.Part1
  }

  /** `<Slot>`, rendered by a ReactHost. */
  get Slot() {
    return Slot
  }

  get slot_props() {
    return this.memo('slot_props', [], () => ({ name: "settings-sections" }))
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type MobileSettingsIndexStores = ReturnType<MobileSettingsIndex['useStores']>

export default MobileSettingsIndex.component()
