/**
 * Code-behind of `ReportBlock.kbview` (converted from `ReportBlock.tsx` by @kubuno/views-migrate).
 */
import type { ReactNode } from "react"

import { ViewBase } from './ReportBlock.kbview'
import * as __parts from './ReportBlock.parts'

export type ReportBlockProps = {
  title:    string
  children: ReactNode
  note?:    ReactNode
  /** This block contains a table that is allowed to run over several sheets. */
  table?:   boolean
}

export class ReportBlock extends ViewBase {
  get part1_props() {
    return this.memo('part1_props', [this.props], () => ({ table: this.props.table, title: this.props.title, children: this.props.children, note: this.props.note }))
  }

  /** A part of the screen still written in React (<section data-report-card>: attribute(s) without a .kbview property). */
  get Part1() {
    return __parts.Part1
  }

}

export default ReportBlock.component()
