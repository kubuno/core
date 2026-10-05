/**
 * Code-behind of `CaptchaPreview.kbview` (converted from `CaptchaPreview.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { authApi, type CaptchaChallenge } from "../../api/auth"

import { ViewBase } from './CaptchaPreview.kbview'
import * as __parts from './CaptchaPreview.parts'

export class CaptchaPreview extends ViewBase {
  @bind accessor nonce = 0
  tr!: CaptchaPreviewStores['t']
  data!: CaptchaPreviewHooks['data']
  isFetching!: boolean

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    return { t }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const { data, isFetching } = useQuery({
      // No setting value in the key: the endpoint reads the SAVED configuration,
      // so the preview is refreshed by the panel invalidating this query once a
      // save has actually landed (see `afterWrite`) — not on the optimistic edit,
      // which would race the write and fetch the previous type. `nonce` is the
      // manual "regenerate".
      queryKey: ['captcha-preview', this.nonce] as const,
      queryFn:  () => authApi.getCaptcha().then(r => r.data),
      staleTime: 0,
      gcTime:    0,
    })
    this.publish({ data, isFetching })
    return { data, isFetching }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t })
    const h = this.useHooks()
    this.publish({ data: h.data, isFetching: h.isFetching })
  }

  get c(): CaptchaChallenge | undefined {
    return this.memo('c', [this.data], () => this.data)
  }

  get part1_props() {
    return this.memo('part1_props', [this.c, this.tr, this.isFetching], () => ({ c: this.c, t: this.tr, setNonce: this.setNonce.bind(this), isFetching: this.isFetching }))
  }

  /** A part of the screen still written in React (<div data-captcha-preview>: attribute(s) without a .kbview property). */
  get Part1() {
    return __parts.Part1
  }

  /** `setNonce` of the TSX: a value, or an update of the previous one. */
  setNonce(value: CaptchaPreview['nonce'] | ((prev: CaptchaPreview['nonce']) => CaptchaPreview['nonce'])) {
    this.nonce = typeof value === 'function' ? (value as (prev: CaptchaPreview['nonce']) => CaptchaPreview['nonce'])(this.nonce) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type CaptchaPreviewStores = ReturnType<CaptchaPreview['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type CaptchaPreviewHooks = ReturnType<CaptchaPreview['useHooks']>

export default CaptchaPreview.component()
