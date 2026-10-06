/**
 * Code-behind of `ReportSeriesChart.kbview` (converted from `ReportSeriesChart.tsx` by @kubuno/views-migrate).
 */
import { useId } from "react"
import { axisTicks } from "./DashboardCharts"

import { ViewBase } from './ReportSeriesChart.kbview'
import * as __parts from './ReportSeriesChart.parts'

export type ReportSeriesChartProps = {
  data:   { label: string; value: number }[]
  color?: string
  /** `bars` for counts of discrete events, `area` for continuous activity. */
  shape?: 'bars' | 'area'
  /** Spells a value in the panel's own unit (counts, or bytes). */
  unit?:  (v: number) => string
}

export class ReportSeriesChart extends ViewBase {
  gid!: string

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const gid = useId()
    return { gid }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ gid: s.gid })
  }

  get color() {
    return this.props.color ?? 'var(--kb-chart-1)'
  }

  get shape() {
    return this.props.shape ?? 'bars'
  }

  get W(): 800 {
    return 800
  }

  get H(): 280 {
    return 280
  }

  get pad(): { l: number; r: number; t: number; b: number; } {
    return this.memo('pad', [], () => ({ l: 74, r: 12, t: 14, b: 46 }))
  }

  get x0(): number {
    return this.pad.l
  }

  get x1(): number {
    return this.W - this.pad.r
  }

  get y0(): number {
    return this.pad.t
  }

  get y1(): number {
    return this.H - this.pad.b
  }

  get plotW(): number {
    return this.x1 - this.x0
  }

  get plotH(): number {
    return this.y1 - this.y0
  }

  get n(): number {
    return this.props.data.length
  }

  get top() {
    if (!(!(this.n === 0))) return undefined as never
    return (axisTicks(Math.max(...this.props.data.map(d => d.value), 0))).top
  }

  get ticks() {
    return this.memo('ticks', [this.props, this.n], () => {
      if (!(!(this.n === 0))) return undefined as never
      return (axisTicks(Math.max(...this.props.data.map(d => d.value), 0))).ticks
    })
  }

  get every(): number {
    if (!(!(this.n === 0))) return undefined as never
    return Math.max(1, Math.ceil(this.n / 12))
  }

  get show_case_1() {
    return !!(this.n === 0)
  }

  get show_main() {
    return !(this.n === 0)
  }

  get part1_props() {
    return this.memo('part1_props', [this.W, this.H, this.gid, this.color, this.ticks, this.x0, this.x1, this.n, this.y1, this.top, this.plotH, this.props, this.shape, this.plotW, this.every], () => {
      if (!(!(this.n === 0))) return undefined as never
      return ({ W: this.W, H: this.H, gid: this.gid, color: this.color, ticks: this.ticks, x0: this.x0, x1: this.x1, yOf: this.yOf.bind(this), unit: this.props.unit, shape: this.shape, n: this.n, plotW: this.plotW, data: this.props.data, y1: this.y1, top: this.top, plotH: this.plotH, every: this.every })
    })
  }

  /** A part of the screen still written in React (<svg> has no .kbview element yet). */
  get Part1() {
    if (!(!(this.n === 0))) return undefined as never
    return __parts.Part1
  }

  yOf(v: number) {
    if (!(!(this.n === 0))) return undefined as never
    return this.y1 - (v / this.top) * this.plotH
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type ReportSeriesChartStores = ReturnType<ReportSeriesChart['useStores']>

export default ReportSeriesChart.component()
