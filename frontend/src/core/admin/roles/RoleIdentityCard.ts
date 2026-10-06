/**
 * Code-behind of `RoleIdentityCard.kbview` (converted from `RoleIdentityCard.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import type { Role } from "../../authz/types"
import { useAuthzLabels } from "../../authz/labels"
import { useDraft } from "../inline-edit/useDraft"
import { useUpdateRole } from "./api"

import { ViewBase } from './RoleIdentityCard.kbview'
import * as __parts from './RoleIdentityCard.parts'

export type RoleIdentityCardProps = {
  role:     Role
  /** Defining a role is super-user-only server-side (guard 1). */
  canEdit:  boolean
  /** The sheet's own verbs, kept in the header in both states. */
  actions?: React.ReactNode
}

export class RoleIdentityCard extends ViewBase {
  @bind accessor editing = false
  tr!: RoleIdentityCardStores['t']
  roleName!: (role: Role) => string
  roleDescription!: (role: Role) => string | null
  update!: RoleIdentityCardHooks['update']
  draft!: RoleIdentityCardHooks['draft']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { roleName, roleDescription } = useAuthzLabels()
    return { t, roleName, roleDescription }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const roleName = this.roleName
    const roleDescription = this.roleDescription
    const update = useUpdateRole(this.props.role.id, () => this.editing = false)
    this.publish({ update })
    const draft  = useDraft({
      name:        roleName(this.props.role),
      description: roleDescription(this.props.role) ?? '',
    })
    this.publish({ draft })
    return { update, draft }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, roleName: s.roleName, roleDescription: s.roleDescription })
    const h = this.useHooks()
    this.publish({ update: h.update, draft: h.draft })
  }

  get part1_props() {
    return this.memo('part1_props', [this.props, this.roleName, this.editing, this.draft, this.update, this.tr, this.roleDescription], () => ({ role: this.props.role, roleName: this.roleName, canEdit: this.props.canEdit, editing: this.editing, draft: this.draft, update: this.update, setEditing: this.setEditing.bind(this), stop: this.stop.bind(this), submit: this.submit.bind(this), t: this.tr, actions: this.props.actions, roleDescription: this.roleDescription }))
  }

  /** A part of the screen still written in React (<EditableCard> is no .kbview element (../inline-edit/EditableCard#default)). */
  get Part1() {
    return __parts.Part1
  }

  stop() { this.editing = false; this.update.reset(); this.draft.reset() }

  submit() {
    if (!this.draft.value.name.trim()) return
    const body: { name?: string; description?: string | null } = {}
    if (this.draft.changed.name !== undefined) body.name = this.draft.value.name.trim()
    if (this.draft.changed.description !== undefined) {
      body.description = this.draft.value.description.trim() || null
    }
    this.update.mutate(body)
  }

  /** `setEditing` of the TSX: a value, or an update of the previous one. */
  setEditing(value: RoleIdentityCard['editing'] | ((prev: RoleIdentityCard['editing']) => RoleIdentityCard['editing'])) {
    this.editing = typeof value === 'function' ? (value as (prev: RoleIdentityCard['editing']) => RoleIdentityCard['editing'])(this.editing) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type RoleIdentityCardStores = ReturnType<RoleIdentityCard['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type RoleIdentityCardHooks = ReturnType<RoleIdentityCard['useHooks']>

export default RoleIdentityCard.component()
