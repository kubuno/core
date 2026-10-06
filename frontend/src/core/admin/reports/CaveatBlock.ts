/**
 * Code-behind of `CaveatBlock.kbview` (converted from `CaveatBlock.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import type { PanelDef } from "../panels/types"

import { ViewBase } from './CaveatBlock.kbview'
import * as __parts from './CaveatBlock.parts'

export type CaveatBlockProps = { def: PanelDef; caveat: string | null }

export class CaveatBlock extends ViewBase {
  tr!: CaveatBlockStores['t']

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

  get spell(): (id: string) => string {
    return this.memo('spell', [this.props], () => {
      if (!(!(!this.props.caveat))) return undefined as never
      return this.props.def.caveatKey ?? ((id: string) => `admin.sec_caveat_${id}`)
    })
  }

  get text(): string {
    if (!(!(!this.props.caveat))) return undefined as never
    return this.tr(this.spell(this.props.caveat), { defaultValue: '' })
  }

  get show_case_1() {
    return !!(!this.props.caveat)
  }

  get show_case_2() {
    return !(!this.props.caveat) && !!(!this.text)
  }

  get show_main() {
    return !(!this.props.caveat) && !(!this.text)
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.text, this.props], () => {
      if (!(!(!this.props.caveat)) || !(!(!this.text))) return undefined as never
      return ({ t: this.tr, text: this.text })
    })
  }

  /** A part of the screen still written in React (<ReportBlock> is no .kbview element (./ReportBlock#default)). */
  get Part1() {
    if (!(!(!this.props.caveat)) || !(!(!this.text))) return undefined as never
    return __parts.Part1
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type CaveatBlockStores = ReturnType<CaveatBlock['useStores']>

export default CaveatBlock.component()
