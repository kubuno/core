/**
 * Code-behind of `CategoryBreakdown.kbview` (converted from `CategoryBreakdown.tsx` by @kubuno/views-migrate).
 */
import { useTranslation } from "react-i18next"
import { formatBytes } from "../sections/format"
import type { CategoryUsage } from "./api"

import { ViewBase } from './CategoryBreakdown.kbview'
import * as __parts from './CategoryBreakdown.parts'

export function formatCount(n: number): string {
  return n.toLocaleString()
}

export type CategoryRowProps = {
  label:      string
  color:      string | null
  billable:   boolean
  row:        CategoryUsage
  showSwatch: boolean
}

export class CategoryBreakdown extends ViewBase {
  tr!: CategoryBreakdownStores['t']

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

  get part1_props() {
    return this.memo('part1_props', [this.props], () => {
      if (!(this.props.showSwatch)) return undefined as never
      return ({ color: this.props.color })
    })
  }

  /** A part of the screen still written in React (<span> with a computed style). */
  get Part1() {
    if (!(this.props.showSwatch)) return undefined as never
    return __parts.Part1
  }

  get variant() {
    return this.props.billable ? 'primary' : 'default'
  }

  get badge_text() {
    return this.props.billable ? this.tr('admin.sto_cat_billable') : this.tr('admin.sto_cat_not_billable')
  }

  get show_row_object_count() {
    return this.props.row.object_count != null
  }

  get sto_cat_objects_n() {
    if (!(this.props.row.object_count != null)) return undefined as never
    return formatCount(this.props.row.object_count)
  }

  get span_text() {
    return formatBytes(this.props.row.used_bytes)
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type CategoryBreakdownStores = ReturnType<CategoryBreakdown['useStores']>

export default CategoryBreakdown.component()
