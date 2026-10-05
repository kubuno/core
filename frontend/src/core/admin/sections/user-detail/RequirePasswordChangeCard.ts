/**
 * Code-behind of `RequirePasswordChangeCard.kbview` (converted from `RequirePasswordChangeCard.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ConfirmDialog, useToast } from "@ui"
import { api } from "../../../api/client"
import { useConfirm } from "../../../hooks/useConfirm"
import type { User } from "../../../types"

import { ViewBase } from './RequirePasswordChangeCard.kbview'
import * as __parts from './RequirePasswordChangeCard.parts'

export type RequirePasswordChangeCardProps = { user: User }

export class RequirePasswordChangeCard extends ViewBase {
  tr!: RequirePasswordChangeCardStores['t']
  i18n!: RequirePasswordChangeCardStores['i18n']
  qc!: RequirePasswordChangeCardStores['qc']
  toast!: RequirePasswordChangeCardStores['toast']
  confirm!: RequirePasswordChangeCardStores['confirm']
  confirmState!: RequirePasswordChangeCardStores['confirmState']
  handleConfirm!: RequirePasswordChangeCardStores['handleConfirm']
  handleCancel!: RequirePasswordChangeCardStores['handleCancel']
  setRequired!: RequirePasswordChangeCardHooks['setRequired']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t, i18n } = useTranslation()
    const qc = useQueryClient()
    const toast = useToast()
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
    return { t, i18n, qc, toast, confirm, confirmState, handleConfirm, handleCancel }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const t = this.tr
    const qc = this.qc
    const toast = this.toast
    const setRequired = useMutation({
      mutationFn: (value: boolean) =>
        api.post(`/admin/users/${this.props.user.id}/require-password-change`, { required: value }),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: ['admin-user', this.props.user.id] })
        void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
        toast.success(t('admin.ud_rpc_done', { defaultValue: 'Enregistré.' }))
      },
      onError: () =>
        toast.error(
          t('admin.ud_rpc_error', { defaultValue: 'Modification impossible.' }),
        ),
    })
    return { setRequired }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, i18n: s.i18n, qc: s.qc, toast: s.toast, confirm: s.confirm, confirmState: s.confirmState, handleConfirm: s.handleConfirm, handleCancel: s.handleCancel })
    const h = this.useHooks()
    this.publish({ setRequired: h.setRequired })
  }

  get required() {
    return this.props.user.must_change_password === true
  }

  get external() {
    return !!this.props.user.oauth_provider
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.required, this.external, this.setRequired, this.props, this.i18n], () => ({ t: this.tr, required: this.required, external: this.external, setRequired: this.setRequired, onToggle: this.onToggle.bind(this), user: this.props.user, i18n: this.i18n }))
  }

  /** A part of the screen still written in React (<Card Icon>: an icon with classes). */
  get Part1() {
    return __parts.Part1
  }

  get show_confirm_state() {
    return this.memo('show_confirm_state', [this.confirmState], () => !!(this.confirmState))
  }

  /** `<ConfirmDialog>`, rendered by a ReactHost. */
  get ConfirmDialog() {
    if (!(this.confirmState)) return undefined as never
    return ConfirmDialog
  }

  get confirm_dialog_props() {
    return this.memo('confirm_dialog_props', [this.confirmState, this.handleConfirm, this.handleCancel], () => {
      if (!(this.confirmState)) return undefined as never
      return ({ ...this.confirmState, onConfirm: this.handleConfirm, onCancel: this.handleCancel })
    })
  }

  async onToggle(value: boolean) {
    if (value) {
      // Stating the cost before the click, not after: the account keeps its
      // sessions but loses every write until somebody sits down at it.
      const ok = await this.confirm({
        title: this.tr('admin.ud_rpc_confirm_title', {
          defaultValue: 'Imposer le changement de mot de passe ?',
        }),
        message: this.tr('admin.ud_rpc_confirm_msg', {
          defaultValue:
            "À sa prochaine connexion, ce compte devra choisir un nouveau mot de passe avant toute autre action. Ses sessions ouvertes ne sont pas fermées : pour cela, réinitialisez le mot de passe.",
        }),
        confirmLabel: this.tr('admin.ud_rpc_confirm_ok', { defaultValue: 'Imposer' }),
        variant: 'warning',
      })
      if (!ok) return
    }
    this.setRequired.mutate(value)
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type RequirePasswordChangeCardStores = ReturnType<RequirePasswordChangeCard['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type RequirePasswordChangeCardHooks = ReturnType<RequirePasswordChangeCard['useHooks']>

export default RequirePasswordChangeCard.component()
