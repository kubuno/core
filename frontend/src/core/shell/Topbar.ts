/**
 * Code-behind of `Topbar.kbview` (converted from `Topbar.tsx` by @kubuno/views-migrate).
 */
import { bind, type MouseEventArgs } from '@kubuno/views'
import { KubunoLogo } from "@ui"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import { useUiStore } from "../store/uiStore"
import { Slot, SlotRegistry } from "../slots/SlotRegistry"
import { useModulesStore } from "../store/modulesStore"
import { useLinkedAccountsStore, type LinkedAccount } from "../store/linkedAccountsStore"
import AddAccountModal from "../components/AddAccountModal"

import { ViewBase } from './Topbar.kbview'
import * as __parts from './Topbar.parts'

export class Topbar extends ViewBase {
  @bind accessor addModalOpen = false
  user!: TopbarStores['user']
  logout!: () => Promise<void>
  toggleSidebar!: () => void
  navigate!: TopbarStores['navigate']
  accounts!: LinkedAccount[]
  remove!: (id: string) => void
  activeModules!: TopbarStores['activeModules']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { user, logout } = useAuthStore()
    const { toggleSidebar } = useUiStore()
    const navigate = useNavigate()
    const { accounts, remove } = useLinkedAccountsStore()
    const activeModules = useModulesStore(s => s.activeModules)
    return { user, logout, toggleSidebar, navigate, accounts, remove, activeModules }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ user: s.user, logout: s.logout, toggleSidebar: s.toggleSidebar, navigate: s.navigate, accounts: s.accounts, remove: s.remove, activeModules: s.activeModules })
  }

  get activeIds(): Set<string> {
    return this.memo('activeIds', [this.activeModules], () => new Set(this.activeModules.map(m => m.module_id)))
  }

  get SettingsButtonOverride() {
    return this.memo('SettingsButtonOverride', [this.activeIds], () => SlotRegistry.getActiveOverride<Record<never, never>>('topbar-settings', this.activeIds))
  }

  get initials(): string {
    return this.user?.display_name
    ? this.user.display_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : this.user?.username?.slice(0, 2).toUpperCase() ?? '?'
  }

  /** `<KubunoLogo>`, rendered by a ReactHost. */
  get KubunoLogo() {
    return KubunoLogo
  }

  get kubuno_logo_props() {
    return this.memo('kubuno_logo_props', [], () => ({ size: 24, className: "text-primary" }))
  }

  /** A part of the screen still written in React (<input> has no .kbview element yet). */
  get Part1() {
    return __parts.Part1
  }

  /** `<Slot>`, rendered by a ReactHost. */
  get Slot() {
    return Slot
  }

  get slot_props() {
    return this.memo('slot_props', [], () => ({ name: "topbar-actions" }))
  }

  get show_settings_button_override() {
    return this.memo('show_settings_button_override', [this.SettingsButtonOverride], () => !!(this.SettingsButtonOverride))
  }

  get show_not_settings_button_override() {
    return this.memo('show_not_settings_button_override', [this.SettingsButtonOverride], () => !(this.SettingsButtonOverride))
  }

  get part2_props() {
    return this.memo('part2_props', [this.SettingsButtonOverride], () => {
      if (!(this.SettingsButtonOverride)) return undefined as never
      return ({ SettingsButtonOverride: this.SettingsButtonOverride })
    })
  }

  /** A part of the screen still written in React (<SettingsButtonOverride> is no .kbview element (a local or dynamic component)). */
  get Part2() {
    if (!(this.SettingsButtonOverride)) return undefined as never
    return __parts.Part2
  }

  /** A part of the screen still written in React (<DropdownMenu.Root> is no .kbview element (a local or dynamic component)). */
  get Part3() {
    return __parts.Part3
  }

  get part4_props() {
    return this.memo('part4_props', [this.user, this.initials, this.accounts, this.remove, this.memo, this.addModalOpen, this.logout, this.navigate], () => ({ user: this.user, user_avatar_url: this.user?.avatar_url, initials: this.initials, accounts: this.accounts, remove: this.remove, setAddModalOpen: this.memo("setAddModalOpen:bound", [], () => this.setAddModalOpen.bind(this)), handleLogout: this.memo("handleLogout:bound", [], () => this.handleLogout.bind(this)) }))
  }

  /** A part of the screen still written in React (<DropdownMenu.Root> is no .kbview element (a local or dynamic component)). */
  get Part4() {
    return __parts.Part4
  }

  /** `<AddAccountModal>`, rendered by a ReactHost. */
  get AddAccountModal() {
    return AddAccountModal
  }

  get add_account_modal_props() {
    return this.memo('add_account_modal_props', [this.addModalOpen], () => ({ open: this.addModalOpen, onClose: () => this.addModalOpen = false } as React.ComponentProps<typeof AddAccountModal>))
  }

  async handleLogout() {
    await this.logout()
    this.navigate('/login')
  }

  panel_click(_sender: unknown, _args: MouseEventArgs) {
    this.toggleSidebar()
  }

  panel_click2(_sender: unknown, _args: MouseEventArgs) {
    this.navigate("/")
  }

  panel_click3(_sender: unknown, _args: MouseEventArgs) {
    this.navigate("/settings")
  }

  /** `setAddModalOpen` of the TSX: a value, or an update of the previous one. */
  setAddModalOpen(value: Topbar['addModalOpen'] | ((prev: Topbar['addModalOpen']) => Topbar['addModalOpen'])) {
    this.addModalOpen = typeof value === 'function' ? (value as (prev: Topbar['addModalOpen']) => Topbar['addModalOpen'])(this.addModalOpen) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type TopbarStores = ReturnType<Topbar['useStores']>

export default Topbar.component()
