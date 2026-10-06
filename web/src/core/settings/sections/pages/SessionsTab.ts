/**
 * Code-behind of `SessionsTab.kbcontrol` (converted from `SessionsTab.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import { useToast } from "@ui"
import { useConfirm } from "../../../hooks/useConfirm"
import { useAuthStore } from "../../../store/authStore"
import { useDisownMyDevice, useMyDevices } from "../../../devices/useDevices"
import { SessionList } from "../../../devices/panels"
import { deviceName } from "../../../devices/labels"
import type { Device } from "../../../devices/types"

import { ViewBase } from './SessionsTab.kbcontrol'
import * as __parts from './SessionsTab.parts.tsx'

export class SessionsTab extends ViewBase {
  tr!: SessionsTabStores['t']
  toast!: SessionsTabStores['toast']
  logout!: SessionsTabStores['logout']
  confirm!: SessionsTabStores['confirm']
  confirmState!: SessionsTabStores['confirmState']
  handleConfirm!: SessionsTabStores['handleConfirm']
  handleCancel!: SessionsTabStores['handleCancel']
  data!: SessionsTabStores['data']
  isLoading!: SessionsTabStores['isLoading']
  isError!: SessionsTabStores['isError']
  refetch!: SessionsTabStores['refetch']
  disown!: SessionsTabStores['disown']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const toast = useToast()
    const logout = useAuthStore(s => s.logout)
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
    const { data, isLoading, isError, refetch } = useMyDevices()
    const disown = useDisownMyDevice()
    return { t, toast, logout, confirm, confirmState, handleConfirm, handleCancel, data, isLoading, isError, refetch, disown }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, toast: s.toast, logout: s.logout, confirm: s.confirm, confirmState: s.confirmState, handleConfirm: s.handleConfirm, handleCancel: s.handleCancel, data: s.data, isLoading: s.isLoading, isError: s.isError, refetch: s.refetch, disown: s.disown })
  }

  get orphans() {
    return this.memo('orphans', [this.data, this.isLoading, this.isError], () => {
      if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
      return this.data.sessions.filter(s => !s.device_id)
    })
  }

  get show_case_1() {
    return !!(this.isLoading)
  }

  get show_case_2() {
    return !(this.isLoading) && !!(this.isError || !this.data)
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.refetch, this.isLoading, this.isError, this.data], () => {
      if (!(!(this.isLoading)) || !(this.isError || !this.data)) return undefined as never
      return ({ t: this.tr, refetch: this.refetch })
    })
  }

  /** A part of the screen still written in React (<EmptyState> action: an object value for a text property). */
  get Part1() {
    if (!(!(this.isLoading)) || !(this.isError || !this.data)) return undefined as never
    return __parts.Part1
  }

  get show_main() {
    return !(this.isLoading) && !(this.isError || !this.data)
  }

  get show_data_devices() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    return this.data.devices.length === 0
  }

  get show_not_data_devices() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    return !(this.data.devices.length === 0)
  }

  /** `<DeviceCard>`, rendered by a ReactHost. */
  get DeviceCard() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(!(this.data.devices.length === 0))) return undefined as never
    return __parts.DeviceCard
  }

  /** The rows of the Repeater over `data.devices`. */
  get rows_devices() {
    return this.memo('rows_devices', [this.data, this.isLoading, this.isError], () => {
      if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(!(this.data.devices.length === 0))) return undefined as never
      return this.data.devices.map((device) => {
      return { device, device_card_props: ((!(this.isLoading)) && (!(this.isError || !this.data)) && (!(this.data.devices.length === 0))) ? ({ device: device, sessions: this.data.sessions.filter(s => s.device_id === device.id), current: this.data.current_device_id === device.id, onDisown: this.onDisown.bind(this) }) : undefined, key: device.id }
    })
    })
  }

  get show_orphans() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    return this.orphans.length > 0
  }

  /** `<SessionList>`, rendered by a ReactHost. */
  get SessionList() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.orphans.length > 0)) return undefined as never
    return SessionList
  }

  get session_list_props() {
    return this.memo('session_list_props', [this.orphans, this.isLoading, this.isError, this.data], () => {
      if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.orphans.length > 0)) return undefined as never
      return ({ sessions: this.orphans })
    })
  }

  get show_confirm_state() {
    return this.memo('show_confirm_state', [this.confirmState, this.isLoading, this.isError, this.data], () => {
      if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
      return !!(this.confirmState)
    })
  }

  get part2_props() {
    return this.memo('part2_props', [this.confirmState, this.handleConfirm, this.handleCancel, this.isLoading, this.isError, this.data], () => {
      if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.confirmState)) return undefined as never
      return ({ confirmState: this.confirmState, handleConfirm: this.handleConfirm, handleCancel: this.handleCancel })
    })
  }

  /** A part of the screen still written in React (<ConfirmDialog {...spread}> (spread props)). */
  get Part2() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.confirmState)) return undefined as never
    return __parts.Part2
  }

  async onDisown(device: Device) {
    const ok = await this.confirm({
      title:   this.tr('devices.not_me_title', { name: deviceName(this.tr, device) }),
      message: this.tr('devices.not_me_message'),
      confirmLabel: this.tr('devices.not_me_confirm'),
      variant: 'danger',
    })
    if (!ok) return
    this.disown.mutate({ id: device.id }, {
      onSuccess: () => {
        this.toast.success(this.tr('devices.toast_disowned'))
        // Every session is gone, including this one: staying on the page would
        // only show a wall of 401s.
        void this.logout()
      },
      onError: () => this.toast.error(this.tr('devices.toast_failed')),
    })
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type SessionsTabStores = ReturnType<SessionsTab['useStores']>

export default SessionsTab.component()
