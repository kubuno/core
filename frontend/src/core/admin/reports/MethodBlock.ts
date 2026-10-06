/**
 * Code-behind of `MethodBlock.kbview` (converted from `MethodBlock.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import type { PanelProvenance } from "./api"
import type { ReportModel } from "./model"

import { ViewBase } from './MethodBlock.kbview'
import * as __parts from './MethodBlock.parts'

function methodKey(measure: string): string | null {
  switch (measure) {
    case 'count':          return 'admin.rep_method_count'
    case 'count_distinct': return 'admin.rep_method_count_distinct'
    case 'sum':            return 'admin.rep_method_sum'
    // A measure this build has no sentence for is left unstated rather than
    // described by the nearest one that happens to exist.
    default: return null
  }
}

export type MethodBlockProps = {
  source: PanelProvenance | undefined
  model:  ReportModel
}

export class MethodBlock extends ViewBase {
  tr!: MethodBlockStores['t']

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

  get key(): string | null {
    return this.props.source ? methodKey(this.props.source.measure) : null
  }

  get part1_props() {
    return this.memo('part1_props', [this.tr, this.props, this.key], () => ({ t: this.tr, source: this.props.source, key: this.key, model: this.props.model }))
  }

  /** A part of the screen still written in React (<ReportBlock> is no .kbview element (./ReportBlock#default)). */
  get Part1() {
    return __parts.Part1
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type MethodBlockStores = ReturnType<MethodBlock['useStores']>

export default MethodBlock.component()
