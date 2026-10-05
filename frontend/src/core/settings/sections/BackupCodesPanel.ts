/**
 * Code-behind of `BackupCodesPanel.kbview` (converted from `BackupCodesPanel.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useTranslation } from "react-i18next"

import { ViewBase } from './BackupCodesPanel.kbview'
import * as __parts from './BackupCodesPanel.parts'

interface Props {
  codes: string[]
  /** Shown once acknowledged; omit to keep the panel permanent. */
  onDone?: () => void
}

export type { Props }

export class BackupCodesPanel extends ViewBase {
  @bind accessor copied = false
  tr!: BackupCodesPanelStores['t']

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

  get asText() {
    return this.props.codes.join('\n')
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.props, this.copied], () => ({ t: this.tr, codes: this.props.codes, copied: this.copied, copy: this.copy.bind(this), print: this.print.bind(this), download: this.download.bind(this), onDone: this.props.onDone }))
  }

  /** A part of the screen still written in React (<Card> bodyClassName: no .kbview property). */
  get Part1() {
    return __parts.Part1
  }

  async copy() {
    try {
      await navigator.clipboard.writeText(this.asText)
      this.copied = true
      window.setTimeout(() => this.copied = false, 2000)
    } catch {
      // Clipboard denied (insecure context, permission): the codes are on screen
      // and the two other paths still work, so there is nothing to report.
    }
  }

  download() {
    const blob = new Blob([`${this.tr('settings.bc_file_header')}\n\n${this.asText}\n`], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kubuno-codes-de-secours.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  print() {
    const frame = document.createElement('iframe')
    frame.style.position = 'fixed'
    frame.style.right = '0'
    frame.style.bottom = '0'
    frame.style.width = '0'
    frame.style.height = '0'
    frame.style.border = '0'
    document.body.appendChild(frame)
    const doc = frame.contentDocument
    if (!doc) { frame.remove(); return }
    const rows = this.props.codes.map((c) => `<li>${c}</li>`).join('')
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${this.tr('settings.bc_title')}</title>` +
      '<style>body{font-family:system-ui,sans-serif;padding:32px}' +
      'h1{font-size:16px;margin:0 0 4px}p{font-size:12px;color:#444;margin:0 0 20px}' +
      'ol{font-family:ui-monospace,monospace;font-size:15px;line-height:2;columns:2}' +
      '</style></head><body>' +
      `<h1>${this.tr('settings.bc_title')}</h1><p>${this.tr('settings.bc_print_note')}</p><ol>${rows}</ol>` +
      '</body></html>'
    )
    doc.close()
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    window.setTimeout(() => frame.remove(), 1000)
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type BackupCodesPanelStores = ReturnType<BackupCodesPanel['useStores']>

export default BackupCodesPanel.component()
