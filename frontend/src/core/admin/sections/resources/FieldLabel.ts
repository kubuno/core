/**
 * Code-behind of `FieldLabel.kbview` (converted from `FieldLabel.tsx` by @kubuno/views-migrate).
 */
import type { ReactNode } from "react"

import { ViewBase } from './FieldLabel.kbview'
import * as __parts from './FieldLabel.parts'

export type FieldLabelProps = {
  children: ReactNode
  htmlFor?: string
}

export class FieldLabel extends ViewBase {
  get part1_props() {
    return this.memo('part1_props', [this.props], () => ({ htmlFor: this.props.htmlFor, children: this.props.children }))
  }

  /** A part of the screen still written in React (<label htmlFor>: attribute(s) without a .kbview property). */
  get Part1() {
    return __parts.Part1
  }

}

export default FieldLabel.component()
