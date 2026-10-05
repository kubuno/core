/**
 * Code-behind of `OrganisationCard.kbview` (converted from `OrganisationCard.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../../../api/client"
import { PRIV } from "../../../../authz/types"
import { usePrivileges } from "../../../../authz/usePrivileges"
import type { OrgUnit, User } from "../../../../types"
import { useDraft } from "../../../inline-edit/useDraft"
import { useUpdateAccount } from "../useAccountEdit"

import { ViewBase } from './OrganisationCard.kbview'
import * as __parts from './OrganisationCard.parts'

type SystemRole = 'user' | 'admin' | 'guest'

export type OrganisationCardProps = { user: User }

export class OrganisationCard extends ViewBase {
  @bind accessor editing = false
  @bind accessor picker = false
  tr!: OrganisationCardStores['t']
  can!: OrganisationCardStores['can']
  isSuperuser!: OrganisationCardStores['isSuperuser']
  orgUnits!: OrganisationCardStores['orgUnits']
  save!: OrganisationCardHooks['save']
  draft!: OrganisationCardHooks['draft']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { can, isSuperuser } = usePrivileges()
    const { data: orgUnits } = useQuery({
      queryKey: ['admin-org-units'],
      queryFn:  () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
      enabled:  can(PRIV.ORG_UNITS_READ),
      staleTime: 60_000,
    })
    return { t, can, isSuperuser, orgUnits }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const save  = useUpdateAccount(this.props.user.id)
    const draft = useDraft({
      role:        this.props.user.role as SystemRole,
      org_unit_id: this.props.user.org_unit_id,
    })
    return { save, draft }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, can: s.can, isSuperuser: s.isSuperuser, orgUnits: s.orgUnits })
    const h = this.useHooks()
    this.publish({ save: h.save, draft: h.draft })
  }

  get canMove() {
    return this.can(PRIV.USERS_UPDATE, this.props.user.org_unit_id) && this.can(PRIV.ORG_UNITS_READ)
  }

  get canEdit() {
    return this.isSuperuser || this.canMove
  }

  get shownUnit() {
    return this.editing ? this.draft.value.org_unit_id : this.props.user.org_unit_id
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.canEdit, this.editing, this.draft, this.save, this.isSuperuser, this.props, this.shownUnit, this.canMove, this.picker], () => ({ t: this.tr, canEdit: this.canEdit, editing: this.editing, draft: this.draft, save: this.save, setEditing: this.setEditing.bind(this), stop: this.stop.bind(this), submit: this.submit.bind(this), isSuperuser: this.isSuperuser, user: this.props.user, unitName: this.unitName.bind(this), shownUnit: this.shownUnit, canMove: this.canMove, setPicker: this.setPicker.bind(this), picker: this.picker }))
  }

  /** A part of the screen still written in React (<EditableCard> is no .kbview element (../../../inline-edit/EditableCard#default)). */
  get Part1() {
    return __parts.Part1
  }

  unitName(id: string | null) {
    return this.orgUnits?.find(u => u.id === id)?.name ?? null
  }

  stop() { this.editing = false; this.picker = false; this.save.reset(); this.draft.reset() }

  submit() {
    const body: Record<string, unknown> = {}
    if (this.draft.changed.role) body.role = this.draft.changed.role
    if ('org_unit_id' in this.draft.changed && this.draft.value.org_unit_id) {
      body.org_unit_id = this.draft.value.org_unit_id
    }
    this.save.mutate(body, { onSuccess: () => { this.editing = false; this.save.reset() } })
  }

  /** `setEditing` of the TSX: a value, or an update of the previous one. */
  setEditing(value: OrganisationCard['editing'] | ((prev: OrganisationCard['editing']) => OrganisationCard['editing'])) {
    this.editing = typeof value === 'function' ? (value as (prev: OrganisationCard['editing']) => OrganisationCard['editing'])(this.editing) : value
  }

  /** `setPicker` of the TSX: a value, or an update of the previous one. */
  setPicker(value: OrganisationCard['picker'] | ((prev: OrganisationCard['picker']) => OrganisationCard['picker'])) {
    this.picker = typeof value === 'function' ? (value as (prev: OrganisationCard['picker']) => OrganisationCard['picker'])(this.picker) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type OrganisationCardStores = ReturnType<OrganisationCard['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type OrganisationCardHooks = ReturnType<OrganisationCard['useHooks']>

export default OrganisationCard.component()
