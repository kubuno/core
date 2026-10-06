/**
 * Code-behind of `RolePrivilegesCard.kbview` (converted from `RolePrivilegesCard.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Privilege, Role } from "../../authz/types"
import { useUpdateRole } from "./api"

import { ViewBase } from './RolePrivilegesCard.kbview'
import * as __parts from './RolePrivilegesCard.parts'

export type RolePrivilegesCardProps = {
  role:      Role
  catalogue: Privilege[]
  canEdit:   boolean
}

export class RolePrivilegesCard extends ViewBase {
  @bind accessor editing = false
  tr!: RolePrivilegesCardStores['t']
  update!: RolePrivilegesCardHooks['update']
  selected!: Set<string>
  setSelected!: RolePrivilegesCardHooks['setSelected']
  keys!: string[]
  blockers!: string[]
  stored!: Set<string>

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    return { t }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const update = useUpdateRole(this.props.role.id, () => this.editing = false)
    this.publish({ update })
    const [selected, setSelected] = useState<Set<string>>(() => new Set(this.props.role.privileges))
    this.publish({ selected, setSelected })
    const keys  = useMemo(() => this.props.catalogue.map(p => p.key), [this.props.catalogue])
    this.publish({ keys })
    const byKey = useMemo(() => new Map(this.props.catalogue.map(p => [p.key, p])), [this.props.catalogue])
    const blockers = useMemo(
      () => [...selected].filter(k => byKey.get(k) && !byKey.get(k)!.is_ou_scopable),
      [selected, byKey],
    )
    this.publish({ blockers })
    const stored = useMemo(() => new Set(this.props.role.privileges), [this.props.role.privileges])
    this.publish({ stored })
    return { update, selected, setSelected, keys, byKey, blockers, stored }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t })
    const h = this.useHooks()
    this.publish({ update: h.update, selected: h.selected, setSelected: h.setSelected, keys: h.keys, blockers: h.blockers, stored: h.stored })
  }

  get dirty(): boolean {
    return this.selected.size !== this.stored.size || [...this.selected].some(k => !this.stored.has(k))
  }

  get frozen(): boolean {
    return this.props.role.is_system || this.props.role.is_superuser
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.props, this.frozen, this.editing, this.update, this.selected, this.dirty, this.blockers, this.keys], () => ({ t: this.tr, canEdit: this.props.canEdit, frozen: this.frozen, editing: this.editing, reset: this.reset.bind(this), update: this.update, setEditing: this.setEditing.bind(this), stop: this.stop.bind(this), selected: this.selected, dirty: this.dirty, role: this.props.role, blockers: this.blockers, keys: this.keys, catalogue: this.props.catalogue, toggle: this.toggle.bind(this) }))
  }

  /** A part of the screen still written in React (<EditableCard> is no .kbview element (../inline-edit/EditableCard#default)). */
  get Part1() {
    return __parts.Part1
  }

  reset() {
    return this.setSelected(new Set(this.props.role.privileges))
  }

  stop() { this.editing = false; this.update.reset(); this.reset() }

  toggle(key: string) {
    return this.setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  /** `setEditing` of the TSX: a value, or an update of the previous one. */
  setEditing(value: RolePrivilegesCard['editing'] | ((prev: RolePrivilegesCard['editing']) => RolePrivilegesCard['editing'])) {
    this.editing = typeof value === 'function' ? (value as (prev: RolePrivilegesCard['editing']) => RolePrivilegesCard['editing'])(this.editing) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type RolePrivilegesCardStores = ReturnType<RolePrivilegesCard['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type RolePrivilegesCardHooks = ReturnType<RolePrivilegesCard['useHooks']>

export default RolePrivilegesCard.component()
