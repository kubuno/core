/**
 * Code-behind of `IdentityCard.kbview` (converted from `IdentityCard.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { PRIV } from "../../../../authz/types"
import { usePrivileges } from "../../../../authz/usePrivileges"
import type { User } from "../../../../types"
import { useDraft } from "../../../inline-edit/useDraft"
import { useUpdateAccount } from "../useAccountEdit"

import { ViewBase } from './IdentityCard.kbview'
import * as __parts from './IdentityCard.parts'

export type IdentityCardProps = { user: User }

export class IdentityCard extends ViewBase {
  @bind accessor editing = false
  tr!: IdentityCardStores['t']
  can!: IdentityCardStores['can']
  save!: IdentityCardHooks['save']
  draft!: IdentityCardHooks['draft']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { can } = usePrivileges()
    return { t, can }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const save = useUpdateAccount(this.props.user.id)
    const draft = useDraft({
      display_name: this.props.user.display_name ?? '',
      first_name:   this.props.user.first_name ?? '',
      last_name:    this.props.user.last_name ?? '',
    })
    return { save, draft }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, can: s.can })
    const h = this.useHooks()
    this.publish({ save: h.save, draft: h.draft })
  }

  get canEdit() {
    return this.can(PRIV.USERS_UPDATE, this.props.user.org_unit_id)
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.canEdit, this.editing, this.draft, this.save, this.props], () => ({ t: this.tr, canEdit: this.canEdit, editing: this.editing, draft: this.draft, save: this.save, setEditing: this.setEditing.bind(this), stop: this.stop.bind(this), submit: this.submit.bind(this), user: this.props.user }))
  }

  /** A part of the screen still written in React (<EditableCard> is no .kbview element (../../../inline-edit/EditableCard#default)). */
  get Part1() {
    return __parts.Part1
  }

  stop() { this.editing = false; this.save.reset(); this.draft.reset() }

  submit() {
    // An empty name is not the empty string: the column falls back to the
    // username, and the server COALESCEs an absent field.
    this.save.mutate(
      {
        display_name: this.draft.value.display_name.trim() || undefined,
        first_name:   this.draft.value.first_name.trim() || null,
        last_name:    this.draft.value.last_name.trim() || null,
      },
      { onSuccess: () => { this.editing = false; this.save.reset() } },
    )
  }

  /** `setEditing` of the TSX: a value, or an update of the previous one. */
  setEditing(value: IdentityCard['editing'] | ((prev: IdentityCard['editing']) => IdentityCard['editing'])) {
    this.editing = typeof value === 'function' ? (value as (prev: IdentityCard['editing']) => IdentityCard['editing'])(this.editing) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type IdentityCardStores = ReturnType<IdentityCard['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type IdentityCardHooks = ReturnType<IdentityCard['useHooks']>

export default IdentityCard.component()
