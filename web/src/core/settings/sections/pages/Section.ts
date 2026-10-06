/**
 * Code-behind of `Section.kbcontrol` (converted from `Section.tsx` by @kubuno/views-migrate).
 */
import { Fragment } from 'react'

import { ViewBase } from './Section.kbcontrol'

export type SectionProps = { title: string; children: React.ReactNode }

export class Section extends ViewBase {
  /** `React.Fragment`: renders the elements an expression holds. */
  get Fragment() {
    return Fragment
  }

  get content_children() {
    return this.memo('content_children', [this.props], () => ({ children: this.props.children }))
  }

}

export default Section.component()
