/**
 * Code-behind of `WatermarkPanel.kbview` (converted from `WatermarkPanel.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Image as ImageIcon, Type, X } from "lucide-react"
import { readImage } from "./watermark"
import type { WatermarkKind, WatermarkSpec } from "./watermark"

import { ViewBase } from './WatermarkPanel.kbview'
import * as __parts from './WatermarkPanel.parts'

export type WatermarkPanelProps = {
  value:    WatermarkSpec
  onChange: (next: WatermarkSpec) => void
}

export class WatermarkPanel extends ViewBase {
  @bind accessor open = false
  @bind accessor error: string | null = null
  tr!: WatermarkPanelStores['t']
  anchorRef!: WatermarkPanelStores['anchorRef']
  fileRef!: WatermarkPanelStores['fileRef']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const anchorRef = useRef<HTMLSpanElement>(null)
    const fileRef   = useRef<HTMLInputElement>(null)
    return { t, anchorRef, fileRef }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, anchorRef: s.anchorRef, fileRef: s.fileRef })
  }

  get kinds(): { id: WatermarkKind; label: string; icon: React.ReactNode }[] {
    return this.memo('kinds', [this.tr], () => [
    { id: 'none',  label: this.tr('admin.rep_wm_none'),  icon: <X size={14} /> },
    { id: 'text',  label: this.tr('admin.rep_wm_text'),  icon: <Type size={14} /> },
    { id: 'image', label: this.tr('admin.rep_wm_image'), icon: <ImageIcon size={14} /> },
  ])
  }

  get summary(): string {
    return this.props.value.kind === 'text' && this.props.value.text.trim() !== '' ? this.props.value.text.trim()
    : this.props.value.kind === 'image' && this.props.value.image ? this.tr('admin.rep_wm_image')
    : this.tr('admin.rep_watermark')
  }

  get part1_props() {
    return this.memo('part1_props', [this.anchorRef, this.props, this.open, this.summary], () => ({ anchorRef: this.anchorRef, value: this.props.value, setOpen: this.setOpen.bind(this), summary: this.summary }))
  }

  /** A part of the screen still written in React (<span ref>: attribute(s) without a .kbview property). */
  get Part1() {
    return __parts.Part1
  }

  get part2_props() {
    return this.memo('part2_props', [this.anchorRef, this.open, this.tr, this.kinds, this.props, this.fileRef, this.error], () => ({ anchorRef: this.anchorRef, open: this.open, setOpen: this.setOpen.bind(this), t: this.tr, kinds: this.kinds, set: this.set.bind(this), value: this.props.value, fileRef: this.fileRef, pick: this.pick.bind(this), value_image: this.props.value?.image, error: this.error, onChange: this.props.onChange }))
  }

  /** A part of the screen still written in React (<Popover> anchorRef: a value the property converts (element-ref)). */
  get Part2() {
    return __parts.Part2
  }

  set(patch: Partial<WatermarkSpec>) {
    return this.props.onChange({ ...this.props.value, ...patch })
  }

  async pick(file: File | undefined) {
    if (!file) return
    this.error = null
    try {
      this.set({ image: await readImage(file), kind: 'image' })
    } catch {
      // The only failure worth naming: everything else this can throw means the
      // browser could not decode the file, which reads the same to the operator.
      this.error = this.tr('admin.rep_wm_bad_image')
    }
  }

  /** `setOpen` of the TSX: a value, or an update of the previous one. */
  setOpen(value: WatermarkPanel['open'] | ((prev: WatermarkPanel['open']) => WatermarkPanel['open'])) {
    this.open = typeof value === 'function' ? (value as (prev: WatermarkPanel['open']) => WatermarkPanel['open'])(this.open) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type WatermarkPanelStores = ReturnType<WatermarkPanel['useStores']>

export default WatermarkPanel.component()
