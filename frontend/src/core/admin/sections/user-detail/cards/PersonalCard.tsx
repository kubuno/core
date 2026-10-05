/**
 * Code-behind of `PersonalCard.kbview` (converted from `PersonalCard.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { Input } from "@ui"
import { PRIV } from "../../../../authz/types"
import { usePrivileges } from "../../../../authz/usePrivileges"
import type { User } from "../../../../types"
import { useDraft } from "../../../inline-edit/useDraft"
import { useUpdateAccount } from "../useAccountEdit"

import { ViewBase } from './PersonalCard.kbview'
import * as __parts from './PersonalCard.parts'

function orNull(v: string): string | null {
  const trimmed = v.trim()
  return trimmed === '' ? null : trimmed
}

export type PersonalCardProps = { user: User }

export class PersonalCard extends ViewBase {
  @bind accessor editing = false
  tr!: PersonalCardStores['t']
  i18n!: PersonalCardStores['i18n']
  can!: PersonalCardStores['can']
  save!: PersonalCardHooks['save']
  draft!: PersonalCardHooks['draft']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t, i18n } = useTranslation()
    const { can } = usePrivileges()
    return { t, i18n, can }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const save  = useUpdateAccount(this.props.user.id)
    const draft = useDraft({
      name_pronunciation: this.props.user.name_pronunciation ?? '',
      pronouns:           this.props.user.pronouns ?? '',
      work_location:      this.props.user.work_location ?? '',
      gender:             this.props.user.gender ?? '',
      birthday:           this.props.user.birthday ?? '',
      introduction:       this.props.user.introduction ?? '',
    })
    return { save, draft }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, i18n: s.i18n, can: s.can })
    const h = this.useHooks()
    this.publish({ save: h.save, draft: h.draft })
  }

  get canEdit() {
    return this.can(PRIV.USERS_UPDATE, this.props.user.org_unit_id)
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.canEdit, this.editing, this.draft, this.save, this.props, this.i18n], () => ({ t: this.tr, canEdit: this.canEdit, editing: this.editing, draft: this.draft, save: this.save, setEditing: this.setEditing.bind(this), stop: this.stop.bind(this), submit: this.submit.bind(this), text: this.text.bind(this), user: this.props.user, i18n: this.i18n }))
  }

  /** A part of the screen still written in React (<EditableCard> is no .kbview element (../../../inline-edit/EditableCard#default)). */
  get Part1() {
    return __parts.Part1
  }

  stop() { this.editing = false; this.save.reset(); this.draft.reset() }

  submit() {
    const body: Record<string, string | null> = {}
    for (const [key, value] of Object.entries(this.draft.changed)) {
      body[key] = orNull(value as string)
    }
    this.save.mutate(body, { onSuccess: () => { this.editing = false; this.save.reset() } })
  }

  text(key: 'name_pronunciation' | 'pronouns' | 'work_location' | 'gender', hint?: string) {
    return (
    <Input
      value={this.draft.value[key]}
      onChange={e => this.draft.set(key, e.target.value)}
      hint={hint}
    />
  )
  }

  /** `setEditing` of the TSX: a value, or an update of the previous one. */
  setEditing(value: PersonalCard['editing'] | ((prev: PersonalCard['editing']) => PersonalCard['editing'])) {
    this.editing = typeof value === 'function' ? (value as (prev: PersonalCard['editing']) => PersonalCard['editing'])(this.editing) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type PersonalCardStores = ReturnType<PersonalCard['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type PersonalCardHooks = ReturnType<PersonalCard['useHooks']>

export default PersonalCard.component()
