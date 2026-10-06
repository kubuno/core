/**
 * Code-behind of `NewTokenBanner.kbcontrol` (converted from `NewTokenBanner.tsx` by @kubuno/views-migrate).
 */
import { bind, type MouseEventArgs } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { fallbackCopy } from "../../clipboard"

import { ViewBase } from './NewTokenBanner.kbcontrol'

export type NewTokenBannerProps = { token: string; onClose: () => void }

export class NewTokenBanner extends ViewBase {
  @bind accessor copied = false
  tr!: NewTokenBannerStores['t']

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

  get show_not_copied() {
    return !(this.copied)
  }

  get text() {
    return this.copied ? this.tr('settings.copied') : this.tr('settings.copy')
  }

  copy() {
    const succeed = () => { this.copied = true; setTimeout(() => this.copied = false, 2000) }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.props.token).then(succeed).catch(() => fallbackCopy(this.props.token, succeed))
    } else {
      fallbackCopy(this.props.token, succeed)
    }
  }

  panel_click(_sender: unknown, _args: MouseEventArgs) {
    this.props.onClose?.()
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type NewTokenBannerStores = ReturnType<NewTokenBanner['useStores']>

export default NewTokenBanner.component()
