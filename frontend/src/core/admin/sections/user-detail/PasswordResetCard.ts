/**
 * Code-behind of `PasswordResetCard.kbview` (converted from `PasswordResetCard.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import type { User } from "../../../types"
import ResetPasswordDialog from "../../ResetPasswordDialog"
import { useAdminAction } from "../../adminAction"

import { ViewBase } from './PasswordResetCard.kbview'
import * as __parts from './PasswordResetCard.parts'

export type PasswordResetCardProps = { user: User }

export class PasswordResetCard extends ViewBase {
  @bind accessor open = false
  tr!: PasswordResetCardStores['t']
  qc!: PasswordResetCardStores['qc']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation('core')
    const qc = useQueryClient()
    return { t, qc }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    useAdminAction('reset-password', () => this.open = true)
    return {  }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, qc: s.qc })
    this.useHooks()
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr], () => ({ t: this.tr, setOpen: this.setOpen.bind(this) }))
  }

  /** A part of the screen still written in React (<Card Icon>: an icon with classes). */
  get Part1() {
    return __parts.Part1
  }

  /** `<ResetPasswordDialog>`, rendered by a ReactHost. */
  get ResetPasswordDialog() {
    if (!(this.open)) return undefined as never
    return ResetPasswordDialog
  }

  get reset_password_dialog_props() {
    return this.memo('reset_password_dialog_props', [this.props, this.open, this.qc], () => {
      if (!(this.open)) return undefined as never
      return ({ userId: this.props.user.id, userLabel: this.props.user.display_name || this.props.user.username, userEmail: this.props.user.email, onClose: () => this.open = false, onDone: () => {
            // The reset flips must_change_password and revokes every session.
            this.qc.invalidateQueries({ queryKey: ['admin-user', this.props.user.id] })
            this.qc.invalidateQueries({ queryKey: ['admin-user-sessions', this.props.user.id] })
            this.qc.invalidateQueries({ queryKey: ['admin', 'users'] })
          } } as React.ComponentProps<typeof ResetPasswordDialog>)
    })
  }

  /** `setOpen` of the TSX: a value, or an update of the previous one. */
  setOpen(value: PasswordResetCard['open'] | ((prev: PasswordResetCard['open']) => PasswordResetCard['open'])) {
    this.open = typeof value === 'function' ? (value as (prev: PasswordResetCard['open']) => PasswordResetCard['open'])(this.open) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type PasswordResetCardStores = ReturnType<PasswordResetCard['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type PasswordResetCardHooks = ReturnType<PasswordResetCard['useHooks']>

export default PasswordResetCard.component()
