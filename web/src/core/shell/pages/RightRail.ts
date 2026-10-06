/**
 * Code-behind of `RightRail.kbcontrol` (converted from `RightRail.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { type MenuDropdownPos } from "@ui"
import { useRightPanelStore } from "../../store/rightPanelStore"
import { useRightRailPrefs } from "../../hooks/useRightRailPrefs"
import { useDockReopenStore } from "../store/dockReopenStore"
import RightRailCustomize from "../dialogs/RightRailCustomize"

import { ViewBase } from './RightRail.kbcontrol'
import * as __parts from './RightRail.parts.tsx'

export class RightRail extends ViewBase {
  @bind accessor editing = false
  @bind accessor reopenMenu: MenuDropdownPos | null = null
  tr!: RightRailStores['t']
  activeModuleId!: string | null
  togglePanel!: (moduleId: string) => void
  entries!: RightRailStores['entries']
  visible!: RightRailStores['visible']
  prefs!: RightRailStores['prefs']
  save!: RightRailStores['save']
  reopenEntries!: RightRailStores['reopenEntries']
  reopen!: ((id: string) => void) | null

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const activeModuleId = useRightPanelStore(s => s.activeModuleId)
    const togglePanel    = useRightPanelStore(s => s.togglePanel)
    const { entries, visible, prefs, save } = useRightRailPrefs()
    const reopenEntries = useDockReopenStore(s => s.entries)
    const reopen = useDockReopenStore(s => s.reopen)
    return { t, activeModuleId, togglePanel, entries, visible, prefs, save, reopenEntries, reopen }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, activeModuleId: s.activeModuleId, togglePanel: s.togglePanel, entries: s.entries, visible: s.visible, prefs: s.prefs, save: s.save, reopenEntries: s.reopenEntries, reopen: s.reopen })
  }

  get customiseLabel(): string {
    if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0))) return undefined as never
    return this.tr('shell.rail_customize', { defaultValue: 'Personnaliser le panneau' })
  }

  get reopenLabel(): string {
    if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0))) return undefined as never
    return this.tr('shell.rail_reopen_panels', { defaultValue: 'Panneaux fermés' })
  }

  get show_case_1() {
    return !!(this.visible.length === 0 && this.reopenEntries.length === 0)
  }

  get show_main() {
    return !(this.visible.length === 0 && this.reopenEntries.length === 0)
  }

  get part1_props() {
    return this.memo('part1_props', [this.visible, this.activeModuleId, this.togglePanel, this.reopenEntries], () => {
      if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0))) return undefined as never
      return ({ visible: this.visible, activeModuleId: this.activeModuleId, togglePanel: this.togglePanel })
    })
  }

  /** A part of the screen still written in React (a list callback destructuring its item). */
  get Part1() {
    if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0))) return undefined as never
    return __parts.Part1
  }

  get show_reopen_entries() {
    if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0))) return undefined as never
    return this.reopenEntries.length > 0
  }

  get part2_props() {
    return this.memo('part2_props', [this.reopenLabel, this.reopenEntries, this.memo, this.reopenMenu, this.visible], () => {
      if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0)) || !(this.reopenEntries.length > 0)) return undefined as never
      return ({ reopenLabel: this.reopenLabel, reopenEntries: this.reopenEntries, setReopenMenu: this.memo("setReopenMenu:bound", [], () => this.setReopenMenu.bind(this)) })
    })
  }

  /** A part of the screen still written in React (<ToolTip> label, side: no .kbview property). */
  get Part2() {
    if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0)) || !(this.reopenEntries.length > 0)) return undefined as never
    return __parts.Part2
  }

  get show_visible() {
    if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0))) return undefined as never
    return this.visible.length > 0
  }

  get part3_props() {
    return this.memo('part3_props', [this.customiseLabel, this.memo, this.editing, this.visible, this.reopenEntries], () => {
      if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0)) || !(this.visible.length > 0)) return undefined as never
      return ({ customiseLabel: this.customiseLabel, setEditing: this.memo("setEditing:bound", [], () => this.setEditing.bind(this)) })
    })
  }

  /** A part of the screen still written in React (<ToolTip> label, side: no .kbview property). */
  get Part3() {
    if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0)) || !(this.visible.length > 0)) return undefined as never
    return __parts.Part3
  }

  /** `<RightRailCustomize>`, rendered by a ReactHost. */
  get RightRailCustomize() {
    if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0)) || !(this.editing)) return undefined as never
    return RightRailCustomize
  }

  get right_rail_customize_props() {
    return this.memo('right_rail_customize_props', [this.entries, this.prefs, this.save, this.editing, this.visible, this.reopenEntries], () => {
      if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0)) || !(this.editing)) return undefined as never
      return ({ entries: this.entries, prefs: this.prefs, onSave: this.save, onClose: () => this.editing = false } as React.ComponentProps<typeof RightRailCustomize>)
    })
  }

  get show_reopen_menu() {
    return this.memo('show_reopen_menu', [this.reopenMenu, this.visible, this.reopenEntries], () => {
      if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0))) return undefined as never
      return !!(this.reopenMenu)
    })
  }

  get part4_props() {
    return this.memo('part4_props', [this.reopenEntries, this.reopen, this.reopenMenu, this.memo, this.visible], () => {
      if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0)) || !(this.reopenMenu)) return undefined as never
      return ({ reopenEntries: this.reopenEntries, reopen: this.reopen, reopenMenu: this.reopenMenu, setReopenMenu: this.memo("setReopenMenu:bound", [], () => this.setReopenMenu.bind(this)) })
    })
  }

  /** A part of the screen still written in React (<ContextMenu> pos, onClose: no .kbview property). */
  get Part4() {
    if (!(!(this.visible.length === 0 && this.reopenEntries.length === 0)) || !(this.reopenMenu)) return undefined as never
    return __parts.Part4
  }

  get visible2() {
    return this.memo('visible2', [this.editing, this.show_main], () => this.editing && this.show_main)
  }

  get visible3() {
    return this.memo('visible3', [this.show_reopen_menu, this.show_main], () => this.show_reopen_menu && this.show_main)
  }

  /** `setReopenMenu` of the TSX: a value, or an update of the previous one. */
  setReopenMenu(value: MenuDropdownPos | null | ((prev: MenuDropdownPos | null) => MenuDropdownPos | null)) {
    this.reopenMenu = typeof value === 'function' ? (value as (prev: MenuDropdownPos | null) => MenuDropdownPos | null)(this.reopenMenu) : value
  }

  /** `setEditing` of the TSX: a value, or an update of the previous one. */
  setEditing(value: RightRail['editing'] | ((prev: RightRail['editing']) => RightRail['editing'])) {
    this.editing = typeof value === 'function' ? (value as (prev: RightRail['editing']) => RightRail['editing'])(this.editing) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type RightRailStores = ReturnType<RightRail['useStores']>

export default RightRail.component()
