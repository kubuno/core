/**
 * Code-behind of `StorageCard.kbview` (converted from `StorageCard.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { PRIV } from "../../../../authz/types"
import { usePrivileges } from "../../../../authz/usePrivileges"
import type { User } from "../../../../types"
import { useAdminAction } from "../../../adminAction"
import { splitQuota, toBytes, type QuotaUnit } from "../../../storage/QuotaField"
import { useAccountStorageUsage } from "../../../storage/api"
import { useUpdateAccount } from "../useAccountEdit"

import { ViewBase } from './StorageCard.kbview'
import * as __parts from './StorageCard.parts'

export type StorageCardProps = { user: User }

export class StorageCard extends ViewBase {
  @bind accessor editing = false
  tr!: StorageCardStores['t']
  can!: StorageCardStores['can']
  amount!: StorageCardHooks['amount']
  setAmount!: StorageCardHooks['setAmount']
  unit!: StorageCardHooks['unit']
  setUnit!: StorageCardHooks['setUnit']
  usage!: StorageCardHooks['usage']
  save!: StorageCardHooks['save']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { can } = usePrivileges()
    return { t, can }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const [amount, setAmount] = useState<string>(this.initial.amount)
    const [unit, setUnit]     = useState<QuotaUnit>(this.initial.unit)
    const usage = useAccountStorageUsage(this.props.user.id)
    const save = useUpdateAccount(this.props.user.id)
    useAdminAction('set-quota', () => { if (this.canEdit) { this.reset(); this.editing = true } })
    return { amount, setAmount, unit, setUnit, usage, save }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, can: s.can })
    const h = this.useHooks()
    this.publish({ amount: h.amount, setAmount: h.setAmount, unit: h.unit, setUnit: h.setUnit, usage: h.usage, save: h.save })
  }

  get initial() {
    return this.memo('initial', [this.props], () => splitQuota(this.props.user.quota_bytes))
  }

  get canEdit() {
    return this.can(PRIV.USERS_UPDATE, this.props.user.org_unit_id)
  }

  get bytes() {
    return toBytes(this.amount, this.unit)
  }

  get dirty() {
    return this.bytes != null && this.bytes !== this.props.user.quota_bytes
  }

  get below() {
    return this.bytes != null && this.bytes < this.props.user.used_bytes
  }

  get shown() {
    return this.editing && this.bytes != null ? this.bytes : this.props.user.quota_bytes
  }

  get pct() {
    return this.shown > 0 ? (this.props.user.used_bytes / this.shown) * 100 : 0
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.canEdit, this.editing, this.save, this.dirty, this.props, this.usage, this.shown, this.pct, this.amount, this.unit, this.setAmount, this.setUnit, this.bytes, this.below], () => ({ t: this.tr, canEdit: this.canEdit, editing: this.editing, reset: this.reset.bind(this), save: this.save, setEditing: this.setEditing.bind(this), stop: this.stop.bind(this), submit: this.submit.bind(this), dirty: this.dirty, user: this.props.user, usage: this.usage, shown: this.shown, pct: this.pct, amount: this.amount, unit: this.unit, setAmount: this.setAmount, setUnit: this.setUnit, bytes: this.bytes, below: this.below }))
  }

  /** A part of the screen still written in React (<EditableCard> is no .kbview element (../../../inline-edit/EditableCard#default)). */
  get Part1() {
    return __parts.Part1
  }

  reset() {
    const fresh = splitQuota(this.props.user.quota_bytes)
    this.setAmount(fresh.amount)
    this.setUnit(fresh.unit)
  }

  stop() { this.editing = false; this.save.reset(); this.reset() }

  submit() {
    if (this.bytes == null) return
    this.save.mutate({ quota_bytes: this.bytes }, {
      onSuccess: () => { this.editing = false; this.save.reset() },
    })
  }

  /** `setEditing` of the TSX: a value, or an update of the previous one. */
  setEditing(value: StorageCard['editing'] | ((prev: StorageCard['editing']) => StorageCard['editing'])) {
    this.editing = typeof value === 'function' ? (value as (prev: StorageCard['editing']) => StorageCard['editing'])(this.editing) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type StorageCardStores = ReturnType<StorageCard['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type StorageCardHooks = ReturnType<StorageCard['useHooks']>

export default StorageCard.component()
