/**
 * Code-behind of `IdentityCard.kbview` (converted from `IdentityCard.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { useDraft } from "../../inline-edit/useDraft"
import { useAudienceMutations, type Audience } from "./api"

import { ViewBase } from './IdentityCard.kbview'
import * as __parts from './IdentityCard.parts'

const NAME_MAX = 40

const DESC_MAX = 150

export type IdentityCardProps = {
  audience: Audience
  canManage: boolean
}

export class IdentityCard extends ViewBase {
  @bind accessor editing = false
  tr!: IdentityCardStores['t']
  update!: IdentityCardHooks['update']
  draft!: IdentityCardHooks['draft']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    return { t }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const { update } = useAudienceMutations(this.props.audience.id)
    this.publish({ update })
    const draft = useDraft({
      name:        this.props.audience.name,
      description: this.props.audience.description ?? '',
    })
    this.publish({ draft })
    return { update, draft }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t })
    const h = this.useHooks()
    this.publish({ update: h.update, draft: h.draft })
  }

  get nameLen(): number {
    return [...this.draft.value.name].length
  }

  get descLen(): number {
    return [...this.draft.value.description].length
  }

  get nameError(): string | undefined {
    return this.draft.value.name.trim().length === 0
    ? this.tr('admin.aud_name_required')
    : this.nameLen > NAME_MAX
      ? this.tr('admin.aud_name_too_long', { count: this.nameLen - NAME_MAX })
      : undefined
  }

  get descError(): string | undefined {
    return this.descLen > DESC_MAX
    ? this.tr('admin.aud_desc_too_long', { count: this.descLen - DESC_MAX })
    : undefined
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.props, this.editing, this.draft, this.update, this.nameError, this.descError, this.nameLen, this.descLen], () => ({ t: this.tr, canManage: this.props.canManage, audience: this.props.audience, editing: this.editing, draft: this.draft, update: this.update, setEditing: this.setEditing.bind(this), stop: this.stop.bind(this), submit: this.submit.bind(this), nameError: this.nameError, descError: this.descError, nameLen: this.nameLen, descLen: this.descLen }))
  }

  /** A part of the screen still written in React (<EditableCard> is no .kbview element (../../inline-edit/EditableCard#default)). */
  get Part1() {
    return __parts.Part1
  }

  stop() { this.editing = false; this.update.reset(); this.draft.reset() }

  submit() {
    if (this.nameError || this.descError) return
    // `PATCH /admin/audiences/:id` takes both fields together, so the unchanged
    // one is echoed — but only ever when the other actually moved.
    this.update.mutate(
      {
        id:          this.props.audience.id,
        name:        this.draft.value.name.trim(),
        description: this.draft.value.description.trim() || null,
      },
      { onSuccess: () => { this.editing = false; this.update.reset() } },
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
