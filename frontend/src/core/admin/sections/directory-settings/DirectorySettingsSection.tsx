/**
 * Code-behind of `DirectorySettingsSection.kbview` (converted from `DirectorySettingsSection.tsx` by @kubuno/views-migrate).
 */
import { bind, type EventArgs } from '@kubuno/views'
import { Fragment } from 'react'
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { PRIV } from "../../../authz/types"
import { usePrivileges } from "../../../authz/usePrivileges"
import SettingScopeBar from "../../settings/SettingScopeBar"
import InheritanceChainWindow from "../../settings/InheritanceChainWindow"
import { settingLabel } from "../../settings/SettingControl"
import { INSTANCE_SCOPE, type ActiveScope } from "../../settings/scopeTypes"
import { useDirectoryPolicy } from "./useDirectoryPolicy"
import { DIRECTORY_KEYS, DIR_AUDIENCE, PERSONAL_DATA_KEYS, PROFILE_FIELDS_NOT_STORED, PROFILE_KEYS, SHARING_KEYS } from "./keys"
import AudienceRow from "./AudienceRow"
import CheckboxRow from "./CheckboxRow"
import ToggleRow from "./ToggleRow"
import UnstoredFieldRow from "./UnstoredFieldRow"

import { ViewBase } from './DirectorySettingsSection.kbview'

export class DirectorySettingsSection extends ViewBase {
  @bind accessor chainKey: string | null = null
  tr!: DirectorySettingsSectionStores['t']
  can!: DirectorySettingsSectionStores['can']
  scope!: ActiveScope
  setScope!: DirectorySettingsSectionStores['setScope']
  policy!: DirectorySettingsSectionStores['policy']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { can } = usePrivileges()
    const [scope, setScope] = useState<ActiveScope>(INSTANCE_SCOPE)
    const policy = useDirectoryPolicy(scope)
    return { t, can, scope, setScope, policy }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, can: s.can, scope: s.scope, setScope: s.setScope, policy: s.policy })
  }

  get canRead(): boolean {
    return this.can(PRIV.SETTINGS_READ)
  }

  get canManage(): boolean {
    return this.can(PRIV.SETTINGS_MANAGE)
  }

  get title() {
    return this.memo('title', [this.tr], () => (
    <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
        {this.tr('admin.nav_directory_settings')}
      </h1>
      <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {this.tr('admin.dirset_meta', { count: DIRECTORY_KEYS.length })}
      </span>
    </div>
  ))
  }

  get known(): string[] {
    return this.memo('known', [this.policy, this.canRead], () => {
      if (!(!(!this.canRead))) return undefined as never
      return DIRECTORY_KEYS.filter(k => this.policy.setting(k))
    })
  }

  get chainSetting() {
    return this.memo('chainSetting', [this.chainKey, this.policy, this.canRead], () => {
      if (!(!(!this.canRead))) return undefined as never
      return this.chainKey ? this.policy.setting(this.chainKey) : undefined
    })
  }

  get show_case_1() {
    return !!(!this.canRead)
  }

  /** `React.Fragment`: renders the elements an expression holds. */
  get Fragment() {
    return Fragment
  }

  get content_title() {
    return this.memo('content_title', [this.title, this.canRead], () => {
      if (!(!this.canRead)) return undefined as never
      return ({ children: this.title })
    })
  }

  get show_main() {
    return !(!this.canRead)
  }

  get content_title2() {
    return this.memo('content_title2', [this.title, this.canRead], () => {
      if (!(!(!this.canRead))) return undefined as never
      return ({ children: this.title })
    })
  }

  /** `<SettingScopeBar>`, rendered by a ReactHost. */
  get SettingScopeBar() {
    if (!(!(!this.canRead))) return undefined as never
    return SettingScopeBar
  }

  get setting_scope_bar_props() {
    return this.memo('setting_scope_bar_props', [this.scope, this.setScope, this.canRead], () => {
      if (!(!(!this.canRead))) return undefined as never
      return ({ scope: this.scope, onChange: this.setScope })
    })
  }

  get show_can_manage() {
    if (!(!(!this.canRead))) return undefined as never
    return !this.canManage
  }

  get show_policy_error() {
    if (!(!(!this.canRead))) return undefined as never
    return !!(this.policy.error)
  }

  get show_not_policy_is_error() {
    if (!(!(!this.canRead))) return undefined as never
    return !(this.policy.isError)
  }

  get show_policy_is_loading_known() {
    if (!(!(!this.canRead)) || !(!(this.policy.isError))) return undefined as never
    return !this.policy.isLoading && this.known.length === 0
  }

  get show_not_policy_is_loading_known() {
    if (!(!(!this.canRead)) || !(!(this.policy.isError))) return undefined as never
    return !(!this.policy.isLoading && this.known.length === 0)
  }

  /** `<ToggleRow>`, rendered by a ReactHost. */
  get ToggleRow() {
    if (!(!(!this.canRead)) || !(!(this.policy.isError)) || !(!(!this.policy.isLoading && this.known.length === 0))) return undefined as never
    return ToggleRow
  }

  /** The rows of the Repeater over `SHARING_KEYS`. */
  get rows_sharing_keys() {
    return this.memo('rows_sharing_keys', [this.canRead, this.policy, this.known, this.canManage], () => {
      if (!(!(!this.canRead)) || !(!(this.policy.isError)) || !(!(!this.policy.isLoading && this.known.length === 0))) return undefined as never
      return SHARING_KEYS.map((key) => {
      return { key, toggle_row_props: ((!(!this.canRead)) && (!(this.policy.isError)) && (!(!this.policy.isLoading && this.known.length === 0))) ? ({ setting: this.policy.setting(key), policy: this.policy, readOnly: !this.canManage, onShowChain: this.setChainKey.bind(this) }) : undefined, rowKey: key }
    })
    })
  }

  /** `<CheckboxRow>`, rendered by a ReactHost. */
  get CheckboxRow() {
    if (!(!(!this.canRead)) || !(!(this.policy.isError)) || !(!(!this.policy.isLoading && this.known.length === 0))) return undefined as never
    return CheckboxRow
  }

  /** The rows of the Repeater over `PROFILE_KEYS`. */
  get rows_profile_keys() {
    return this.memo('rows_profile_keys', [this.canRead, this.policy, this.known, this.canManage], () => {
      if (!(!(!this.canRead)) || !(!(this.policy.isError)) || !(!(!this.policy.isLoading && this.known.length === 0))) return undefined as never
      return PROFILE_KEYS.map((key) => {
      return { key, checkbox_row_props: ((!(!this.canRead)) && (!(this.policy.isError)) && (!(!this.policy.isLoading && this.known.length === 0))) ? ({ setting: this.policy.setting(key), policy: this.policy, readOnly: !this.canManage, onShowChain: this.setChainKey.bind(this), personal: PERSONAL_DATA_KEYS.includes(key) }) : undefined, rowKey: key }
    })
    })
  }

  /** `<UnstoredFieldRow>`, rendered by a ReactHost. */
  get UnstoredFieldRow() {
    if (!(!(!this.canRead)) || !(!(this.policy.isError)) || !(!(!this.policy.isLoading && this.known.length === 0))) return undefined as never
    return UnstoredFieldRow
  }

  /** The rows of the Repeater over `PROFILE_FIELDS_NOT_STORED`. */
  get rows_profile_fields_not_stored() {
    return this.memo('rows_profile_fields_not_stored', [this.canRead, this.policy, this.known], () => {
      if (!(!(!this.canRead)) || !(!(this.policy.isError)) || !(!(!this.policy.isLoading && this.known.length === 0))) return undefined as never
      return PROFILE_FIELDS_NOT_STORED.map((f) => {
      return { f, unstored_field_row_props: ((!(!this.canRead)) && (!(this.policy.isError)) && (!(!this.policy.isLoading && this.known.length === 0))) ? ({ field: f }) : undefined, key: f }
    })
    })
  }

  /** `<AudienceRow>`, rendered by a ReactHost. */
  get AudienceRow() {
    if (!(!(!this.canRead)) || !(!(this.policy.isError)) || !(!(!this.policy.isLoading && this.known.length === 0))) return undefined as never
    return AudienceRow
  }

  get audience_row_props() {
    return this.memo('audience_row_props', [this.policy, this.canManage, this.canRead, this.known], () => {
      if (!(!(!this.canRead)) || !(!(this.policy.isError)) || !(!(!this.policy.isLoading && this.known.length === 0))) return undefined as never
      return ({ setting: this.policy.setting(DIR_AUDIENCE), policy: this.policy, readOnly: !this.canManage, onShowChain: this.setChainKey.bind(this) })
    })
  }

  get visible() {
    return this.memo('visible', [this.show_policy_is_loading_known, this.show_not_policy_is_error, this.canRead], () => {
      if (!(!(!this.canRead))) return undefined as never
      return this.show_policy_is_loading_known && this.show_not_policy_is_error
    })
  }

  get visible2() {
    return this.memo('visible2', [this.show_not_policy_is_loading_known, this.show_not_policy_is_error, this.canRead], () => {
      if (!(!(!this.canRead))) return undefined as never
      return this.show_not_policy_is_loading_known && this.show_not_policy_is_error
    })
  }

  get show_chain_key() {
    if (!(!(!this.canRead))) return undefined as never
    return !!(this.chainKey)
  }

  /** `<InheritanceChainWindow>`, rendered by a ReactHost. */
  get InheritanceChainWindow() {
    if (!(!(!this.canRead)) || !(this.chainKey)) return undefined as never
    return InheritanceChainWindow
  }

  get inheritance_chain_window_props() {
    return this.memo('inheritance_chain_window_props', [this.chainKey, this.scope, this.chainSetting, this.tr, this.canRead], () => {
      if (!(!(!this.canRead)) || !(this.chainKey)) return undefined as never
      return ({ settingKey: this.chainKey, scope: this.scope, title: this.chainSetting ? settingLabel(this.tr, this.chainSetting) : undefined, onClose: () => this.chainKey = null } as React.ComponentProps<typeof InheritanceChainWindow>)
    })
  }

  callout_dismiss(_sender: unknown, _args: EventArgs) {
    if (!(!(!this.canRead)) || !(this.policy.error)) return undefined as never
    return (this.policy.clearError)?.()
  }

  empty_state_action(_sender: unknown, _args: EventArgs) {
    if (!(!(!this.canRead)) || !(this.policy.isError)) return undefined as never
    void this.policy.refetch()
  }

  /** `setChainKey` of the TSX: a value, or an update of the previous one. */
  setChainKey(value: string | null | ((prev: string | null) => string | null)) {
    this.chainKey = typeof value === 'function' ? (value as (prev: string | null) => string | null)(this.chainKey) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type DirectorySettingsSectionStores = ReturnType<DirectorySettingsSection['useStores']>

export default DirectorySettingsSection.component()
