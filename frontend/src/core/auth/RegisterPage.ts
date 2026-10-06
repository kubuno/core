/**
 * Code-behind of `RegisterPage.kbview` (converted from `RegisterPage.tsx` by @kubuno/views-migrate).
 */
import { bind, type EventArgs, type MouseEventArgs } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { authApi } from "../api/auth"
import { passwordStrength } from "./passwordStrength"
import { InstanceLogo } from "../shell/controls/InstanceLogo"

import { ViewBase } from './RegisterPage.kbview'
import * as __parts from './RegisterPage.parts'

export class RegisterPage extends ViewBase {
  @bind accessor form = {
    email: '', username: '', password: '', confirm: '', display_name: '',
  }
  @bind accessor showPassword = false
  @bind accessor error = ''
  @bind accessor isLoading = false
  tr!: RegisterPageStores['t']
  navigate!: RegisterPageStores['navigate']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    return { t, navigate }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, navigate: s.navigate })
  }

  get strength() {
    return this.memo('strength', [this.form], () => passwordStrength(this.form.password))
  }

  /** `<InstanceLogo>`, rendered by a ReactHost. */
  get InstanceLogo() {
    return InstanceLogo
  }

  get instance_logo_props() {
    return this.memo('instance_logo_props', [], () => ({ size: 26, className: "text-primary" }))
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.form, this.memo], () => ({ t: this.tr, form: this.form, handleChange: this.memo("handleChange:bound", [], () => this.handleChange.bind(this)) }))
  }

  /** A part of the screen still written in React (<TextField> name: no .kbview property). */
  get Part1() {
    return __parts.Part1
  }

  /** A part of the screen still written in React (<TextField> label: an object value for a text property). */
  get Part2() {
    return __parts.Part2
  }

  /** A part of the screen still written in React (<TextField> label: an object value for a text property). */
  get Part3() {
    return __parts.Part3
  }

  get part4_props() {
    return this.memo('part4_props', [this.tr, this.showPassword, this.form, this.memo], () => ({ t: this.tr, showPassword: this.showPassword, form: this.form, handleChange: this.memo("handleChange:bound", [], () => this.handleChange.bind(this)) }))
  }

  /** A part of the screen still written in React (<TextField> label: an object value for a text property). */
  get Part4() {
    return __parts.Part4
  }

  get show_not_show_password() {
    return !(this.showPassword)
  }

  get show_form_password() {
    return !!(this.form.password)
  }

  /** A part of the screen still written in React (<div> with a computed style). */
  get Part5() {
    if (!(this.form.password)) return undefined as never
    return __parts.Part5
  }

  /** The rows of the Repeater over `Array.from({ length: 5 })`. */
  get rows_items() {
    return this.memo('rows_items', [this.form, this.strength], () => {
      if (!(this.form.password)) return undefined as never
      return Array.from({ length: 5 }).map((_, i) => {
      return { _, i, part5_props: ((this.form.password)) ? ({ i: i, strength: this.strength }) : undefined, key: i }
    })
    })
  }

  get part6_props() {
    return this.memo('part6_props', [this.strength, this.tr, this.form], () => {
      if (!(this.form.password)) return undefined as never
      return ({ strength: this.strength, t: this.tr })
    })
  }

  /** A part of the screen still written in React (<span> with a computed style). */
  get Part6() {
    if (!(this.form.password)) return undefined as never
    return __parts.Part6
  }

  /** A part of the screen still written in React (<TextField> label: an object value for a text property). */
  get Part7() {
    return __parts.Part7
  }

  get show_error() {
    return !!(this.error)
  }

  handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.form = ({ ...this.form, [e.target.name]: e.target.value })
  }

  async handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    this.error = ''

    if (this.form.password !== this.form.confirm) {
      this.error = this.tr('register.err_mismatch')
      return
    }
    if (this.form.password.length < 8) {
      this.error = this.tr('register.err_min')
      return
    }

    this.isLoading = true
    try {
      await authApi.register({
        email: this.form.email,
        username: this.form.username,
        password: this.form.password,
        display_name: this.form.display_name || undefined,
      })
      this.navigate('/login?registered=1')
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      this.error = msg ?? this.tr('register.err_generic')
    } finally {
      this.isLoading = false
    }
  }

  panel_submit(_sender: unknown, args: EventArgs) {
    return this.handleSubmit(args.native as never)
  }

  panel_click(_sender: unknown, _args: MouseEventArgs) {
    this.showPassword = !this.showPassword
  }

  link_label_click(_sender: unknown, _args: MouseEventArgs) {
    this.navigate("/login")
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type RegisterPageStores = ReturnType<RegisterPage['useStores']>

export default RegisterPage.component()
