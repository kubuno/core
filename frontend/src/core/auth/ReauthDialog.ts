/**
 * Code-behind of `ReauthDialog.kbview` (converted from `ReauthDialog.tsx` by @kubuno/views-migrate).
 */
import { bind, type EventArgs, type MouseEventArgs } from '@kubuno/views'
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { api } from "../api/client"

import { ViewBase } from './ReauthDialog.kbview'
import * as __parts from './ReauthDialog.parts'

interface Challenge {
  methods: string[]
  token_ttl_seconds: number
  grace_seconds: number
  backup_codes_remaining: number
}

interface Props {
  /** Called with the fresh proof; the API client replays the request with it. */
  onProof: (token: string) => void
  onCancel: () => void
}

export type { Props }

export class ReauthDialog extends ViewBase {
  @bind accessor challenge: Challenge | null = null
  @bind accessor value = ''
  @bind accessor error = ''
  @bind accessor busy = false
  tr!: ReauthDialogStores['t']
  inputRef!: ReauthDialogStores['inputRef']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const inputRef = useRef<HTMLInputElement>(null)
    return { t, inputRef }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const t = this.tr
    const inputRef = this.inputRef
    useEffect(() => {
      let cancelled = false
      api
        .get<Challenge>('/auth/reauth/challenge')
        .then(({ data }) => { if (!cancelled) this.challenge = data })
        .catch((err: { message?: string }) => {
          if (!cancelled) this.error = err?.message ?? t('reauth.err_generic')
        })
      return () => { cancelled = true }
    }, [t])
    useEffect(() => { inputRef.current?.focus() }, [this.challenge])
    return {  }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, inputRef: s.inputRef })
    this.useHooks()
  }

  get usesCode(): boolean {
    return this.challenge?.methods.includes('totp') ?? false
  }

  get noMethod(): boolean {
    return this.challenge !== null && this.challenge.methods.length === 0
  }

  get show_not_no_method() {
    return !(this.noMethod)
  }

  get part1_props() {
    return this.memo('part1_props', [this.inputRef, this.usesCode, this.tr, this.value, this.memo, this.noMethod], () => {
      if (!(!(this.noMethod))) return undefined as never
      return ({ inputRef: this.inputRef, usesCode: this.usesCode, t: this.tr, value: this.value, setValue: this.memo("setValue:bound", [], () => this.setValue.bind(this)) })
    })
  }

  /** A part of the screen still written in React (<TextField> ref: no .kbview property). */
  get Part1() {
    if (!(!(this.noMethod))) return undefined as never
    return __parts.Part1
  }

  get backup_hint_count() {
    if (!(this.usesCode)) return undefined as never
    return this.challenge?.backup_codes_remaining ?? 0
  }

  get show_error() {
    return !!(this.error)
  }

  get enabled_unless_busy_no_method_value() {
    return !(this.busy || this.noMethod || !this.value.trim())
  }

  async submit(e: React.FormEvent) {
    e.preventDefault()
    if (!this.value.trim() || this.busy) return
    this.busy = true
    this.error = ''
    try {
      // The submitted value is routed by the server: a backup code and a
      // time-based code arrive through the same field, because that is what
      // people type when they have lost their phone.
      const body = this.usesCode ? { code: this.value.trim() } : { password: this.value }
      const { data } = await api.post<{ reauth_token: string }>('/auth/reauth', body)
      this.props.onProof(data.reauth_token)
    } catch (err: unknown) {
      this.error = (err as { message?: string })?.message ?? this.tr('reauth.err_generic')
      this.value = ''
      this.inputRef.current?.focus()
    } finally {
      this.busy = false
    }
  }

  floating_window_close(_sender: unknown, _args: EventArgs) {
    this.props.onCancel?.()
  }

  panel_submit(_sender: unknown, args: EventArgs) {
    return this.submit(args.native as never)
  }

  button_click(_sender: unknown, _args: MouseEventArgs) {
    this.props.onCancel?.()
  }

  /** `setValue` of the TSX: a value, or an update of the previous one. */
  setValue(value: ReauthDialog['value'] | ((prev: ReauthDialog['value']) => ReauthDialog['value'])) {
    this.value = typeof value === 'function' ? (value as (prev: ReauthDialog['value']) => ReauthDialog['value'])(this.value) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type ReauthDialogStores = ReturnType<ReauthDialog['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type ReauthDialogHooks = ReturnType<ReauthDialog['useHooks']>

export default ReauthDialog.component()
