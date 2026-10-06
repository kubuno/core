/**
 * Code-behind of `HeaderActions.kbview` (converted from `HeaderActions.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useModulesStore } from "../store/modulesStore"
import { useNotificationStore } from "../store/notificationStore"
import { useAlertFeed } from "./useAlertFeed"
import { useModuleLoadAlerts } from "./useModuleLoadAlerts"
import { useModuleNotifications } from "./useModuleNotifications"
import { Slot, SlotRegistry } from "../slots/SlotRegistry"
import { useWaffleApps } from "./useWaffleApps"
import AddAccountModal from "../components/AddAccountModal"
import WaffleButton from "./menus/WaffleButton"
import AccountButton from "./menus/AccountButton"
import SettingsMenu from "./SettingsMenu"

import { ViewBase } from './HeaderActions.kbview'
import * as __parts from './HeaderActions.parts'

export type HeaderActionsProps = { compact?: boolean; dark?: boolean; minimal?: boolean }

export class HeaderActions extends ViewBase {
  @bind accessor addAccountOpen = false
  @bind accessor addAccountPrefill: { email: string; slot: number } | undefined = undefined
  tr!: HeaderActionsStores['t']
  activeModules!: HeaderActionsStores['activeModules']
  notifications!: HeaderActionsStores['notifications']
  unreadCount!: number
  markRead!: (id: string) => void
  markAllRead!: () => void
  navigate!: HeaderActionsStores['navigate']
  pathname!: string
  allWaffleApps!: HeaderActionsStores['allWaffleApps']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { activeModules } = useModulesStore()
    const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore()
    useAlertFeed()
    useModuleLoadAlerts()
    useModuleNotifications()
    const navigate = useNavigate()
    const pathname = useLocation().pathname
    const allWaffleApps = useWaffleApps()
    return { t, activeModules, notifications, unreadCount, markRead, markAllRead, navigate, pathname, allWaffleApps }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, activeModules: s.activeModules, notifications: s.notifications, unreadCount: s.unreadCount, markRead: s.markRead, markAllRead: s.markAllRead, navigate: s.navigate, pathname: s.pathname, allWaffleApps: s.allWaffleApps })
  }

  get compact() {
    return this.props.compact ?? false
  }

  get dark() {
    return this.props.dark ?? false
  }

  get minimal() {
    return this.props.minimal ?? false
  }

  get activeIds(): Set<string> {
    return this.memo('activeIds', [this.activeModules], () => new Set(this.activeModules.map(m => m.module_id)))
  }

  get SettingsButtonOverride() {
    return this.memo('SettingsButtonOverride', [this.activeIds], () => SlotRegistry.getActiveOverride<{ compact?: boolean; dark?: boolean }>('topbar-settings', this.activeIds))
  }

  get isHome(): boolean {
    return this.pathname === '/'
  }

  get ico(): 18 {
    return 18
  }

  get btn(): string {
    return `w-9 h-9 rounded-full flex items-center justify-center transition-colors focus:outline-none ${
    this.dark ? 'text-white/75 hover:bg-white/15 data-[state=open]:bg-white/15' : 'text-text-secondary hover:bg-surface-3 data-[state=open]:bg-surface-3'}`
  }

  get show_minimal() {
    return !this.minimal
  }

  /** `<Slot>`, rendered by a ReactHost. */
  get Slot() {
    if (!(!this.minimal)) return undefined as never
    return Slot
  }

  get slot_props() {
    return this.memo('slot_props', [this.minimal], () => {
      if (!(!this.minimal)) return undefined as never
      return ({ name: "header-actions-right" })
    })
  }

  get slot_props2() {
    return this.memo('slot_props2', [this.dark, this.compact, this.minimal], () => {
      if (!(!this.minimal)) return undefined as never
      return ({ name: "topbar-actions", dark: this.dark, compact: this.compact })
    })
  }

  get part1_props() {
    return this.memo('part1_props', [this.btn, this.tr, this.ico, this.unreadCount, this.markAllRead, this.notifications, this.markRead, this.navigate, this.minimal], () => {
      if (!(!this.minimal)) return undefined as never
      return ({ btn: this.btn, t: this.tr, ico: this.ico, unreadCount: this.unreadCount, markAllRead: this.markAllRead, notifications: this.notifications, markRead: this.markRead, navigate: this.navigate })
    })
  }

  /** A part of the screen still written in React (<DropdownMenu.Root> is no .kbview element (a local or dynamic component)). */
  get Part1() {
    if (!(!this.minimal)) return undefined as never
    return __parts.Part1
  }

  get show_not_is_home() {
    if (!(!this.minimal)) return undefined as never
    return !(this.isHome)
  }

  get show_settings_button_override() {
    return this.memo('show_settings_button_override', [this.SettingsButtonOverride, this.minimal, this.isHome], () => {
      if (!(!this.minimal) || !(!(this.isHome))) return undefined as never
      return !!(this.SettingsButtonOverride)
    })
  }

  get show_not_settings_button_override() {
    return this.memo('show_not_settings_button_override', [this.SettingsButtonOverride, this.minimal, this.isHome], () => {
      if (!(!this.minimal) || !(!(this.isHome))) return undefined as never
      return !(this.SettingsButtonOverride)
    })
  }

  get part2_props() {
    return this.memo('part2_props', [this.SettingsButtonOverride, this.compact, this.dark, this.minimal, this.isHome], () => {
      if (!(!this.minimal) || !(!(this.isHome)) || !(this.SettingsButtonOverride)) return undefined as never
      return ({ SettingsButtonOverride: this.SettingsButtonOverride, compact: this.compact, dark: this.dark })
    })
  }

  /** A part of the screen still written in React (<SettingsButtonOverride> is no .kbview element (a local or dynamic component)). */
  get Part2() {
    if (!(!this.minimal) || !(!(this.isHome)) || !(this.SettingsButtonOverride)) return undefined as never
    return __parts.Part2
  }

  /** `<SettingsMenu>`, rendered by a ReactHost. */
  get SettingsMenu() {
    if (!(!this.minimal) || !(!(this.isHome)) || !(!(this.SettingsButtonOverride))) return undefined as never
    return SettingsMenu
  }

  get settings_menu_props() {
    return this.memo('settings_menu_props', [this.btn, this.ico, this.tr, this.minimal, this.isHome, this.SettingsButtonOverride], () => {
      if (!(!this.minimal) || !(!(this.isHome)) || !(!(this.SettingsButtonOverride))) return undefined as never
      return ({ triggerClassName: this.btn, iconSize: this.ico, ariaLabel: this.tr('header.settings') })
    })
  }

  get visible() {
    return this.memo('visible', [this.show_settings_button_override, this.show_not_is_home, this.minimal], () => {
      if (!(!this.minimal)) return undefined as never
      return this.show_settings_button_override && this.show_not_is_home
    })
  }

  get visible2() {
    return this.memo('visible2', [this.show_not_settings_button_override, this.show_not_is_home, this.minimal], () => {
      if (!(!this.minimal)) return undefined as never
      return this.show_not_settings_button_override && this.show_not_is_home
    })
  }

  get part3_props() {
    return this.memo('part3_props', [this.btn, this.ico, this.tr, this.minimal], () => {
      if (!(!this.minimal)) return undefined as never
      return ({ btn: this.btn, ico: this.ico, t: this.tr })
    })
  }

  /** A part of the screen still written in React (<DropdownMenu.Root> is no .kbview element (a local or dynamic component)). */
  get Part3() {
    if (!(!this.minimal)) return undefined as never
    return __parts.Part3
  }

  get visible3() {
    return this.memo('visible3', [this.visible, this.show_minimal], () => this.visible && this.show_minimal)
  }

  get visible4() {
    return this.memo('visible4', [this.visible2, this.show_minimal], () => this.visible2 && this.show_minimal)
  }

  /** `<WaffleButton>`, rendered by a ReactHost. */
  get WaffleButton() {
    return WaffleButton
  }

  get waffle_button_props() {
    return this.memo('waffle_button_props', [this.allWaffleApps, this.compact, this.dark], () => ({ allApps: this.allWaffleApps, compact: this.compact, dark: this.dark }))
  }

  /** `<AccountButton>`, rendered by a ReactHost. */
  get AccountButton() {
    return AccountButton
  }

  get account_button_props() {
    return this.memo('account_button_props', [this.addAccountPrefill, this.addAccountOpen], () => ({ onAddAccount: prefill => { this.addAccountPrefill = prefill; this.addAccountOpen = true } } as React.ComponentProps<typeof AccountButton>))
  }

  /** `<AddAccountModal>`, rendered by a ReactHost. */
  get AddAccountModal() {
    return AddAccountModal
  }

  get add_account_modal_props() {
    return this.memo('add_account_modal_props', [this.addAccountOpen, this.addAccountPrefill], () => ({ open: this.addAccountOpen, onClose: () => { this.addAccountOpen = false; this.addAccountPrefill = undefined }, prefillEmail: this.addAccountPrefill?.email, slot: this.addAccountPrefill?.slot } as React.ComponentProps<typeof AddAccountModal>))
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type HeaderActionsStores = ReturnType<HeaderActions['useStores']>

export default HeaderActions.component()
