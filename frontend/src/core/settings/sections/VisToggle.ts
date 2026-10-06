/**
 * Code-behind of `VisToggle.kbview` (converted from `VisToggle.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { type Vis } from "./profileFields"

import { ViewBase } from './VisToggle.kbview'

export type VisToggleProps = { value: Vis; onChange: (v: Vis) => void }

export class VisToggle extends ViewBase {
  tr!: VisToggleStores['t']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    return { t }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t })
  }

  get isPublic(): boolean {
    return this.props.value === 'public'
  }

  get show_not_is_public() {
    return !(this.isPublic)
  }

  get tooltip() {
    return this.isPublic ? this.tr('settings.profile_vis_public', { defaultValue: 'Visible par tous' }) : this.tr('settings.profile_vis_private', { defaultValue: 'Privé' })
  }

  panel_click(_sender: unknown, _args: MouseEventArgs) {
    this.props.onChange(this.isPublic ? 'private' : 'public')
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type VisToggleStores = ReturnType<VisToggle['useStores']>

export default VisToggle.component()
