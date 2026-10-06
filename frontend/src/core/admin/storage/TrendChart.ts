/**
 * Code-behind of `TrendChart.kbview` (converted from `TrendChart.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useEffect, useMemo, useRef, useState } from "react"
import { type TrendDatum } from "./charts"

import { ViewBase } from './TrendChart.kbview'
import * as __parts from './TrendChart.parts'

function useWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver(entries => setW(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}

const PAD = { l: 52, r: 12, t: 12, b: 22 }

function niceCeil(v: number): number {
  if (v <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(v))
  const f = v / pow
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow
}

export type TrendChartProps = {
  data:    TrendDatum[]
  height?: number
  label:   string
}

export class TrendChart extends ViewBase {
  @bind accessor hover: number | null = null
  wrap!: TrendChartStores['wrap']
  width!: number
  geom!: { t0: number; span: number; top: number; x0: number; x1: number; y0: number; y1: number; px: (d: TrendDatum) => number; py: (v: number) => number; } | null
  ticks!: number[]

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const wrap = useRef<HTMLDivElement>(null)
    const width = useWidth(wrap)
    return { wrap, width }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const width = this.width
    const geom = useMemo(() => {
      if (this.props.data.length < 2 || width === 0) return null
      const t0 = new Date(this.props.data[0].day).getTime()
      const t1 = new Date(this.props.data[this.props.data.length - 1].day).getTime()
      const span = Math.max(t1 - t0, 1)
      const top = niceCeil(Math.max(...this.props.data.map(d => d.value), 1))
      const x0 = PAD.l, x1 = Math.max(width - PAD.r, PAD.l + 1)
      const y0 = PAD.t, y1 = this.height - PAD.b
      const px = (d: TrendDatum) => x0 + ((new Date(d.day).getTime() - t0) / span) * (x1 - x0)
      const py = (v: number) => y1 - (v / top) * (y1 - y0)
      return { t0, span, top, x0, x1, y0, y1, px, py }
    }, [this.props.data, width, this.height])
    this.publish({ geom })
    const ticks = useMemo(() => {
      if (!geom) return []
      return [0, 0.25, 0.5, 0.75, 1].map(f => geom.top * f)
    }, [geom])
    this.publish({ ticks })
    return { geom, ticks }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ wrap: s.wrap, width: s.width })
    const h = this.useHooks()
    this.publish({ geom: h.geom, ticks: h.ticks })
  }

  get height() {
    return this.props.height ?? 180
  }

  get points(): string {
    const geom = this.geom
    return geom ? this.props.data.map(d => `${geom.px(d)},${geom.py(d.value)}`).join(' ') : ''
  }

  get area(): string {
    return this.geom
    ? `M ${this.geom.px(this.props.data[0])},${this.geom.y1} L ${this.points.split(' ').join(' L ')} L ${this.geom.px(this.props.data[this.props.data.length - 1])},${this.geom.y1} Z`
    : ''
  }

  get hovered(): TrendDatum | null {
    return this.memo('hovered', [this.hover, this.props], () => this.hover != null ? this.props.data[this.hover] : null)
  }

  get last(): TrendDatum {
    return this.memo('last', [this.props], () => this.props.data[this.props.data.length - 1])
  }

  get part1_props() {
    return this.memo('part1_props', [this.wrap, this.geom, this.width, this.height, this.props, this.ticks, this.area, this.points, this.last, this.hovered], () => ({ wrap: this.wrap, geom: this.geom, width: this.width, height: this.height, label: this.props.label, onMove: this.onMove.bind(this), setHover: this.setHover.bind(this), ticks: this.ticks, area: this.area, points: this.points, last: this.last, hovered: this.hovered }))
  }

  /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
  get Part1() {
    return __parts.Part1
  }

  onMove(e: React.MouseEvent<SVGSVGElement>) {
    const geom = this.geom
    if (!geom) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let best = 0
    let bestD = Infinity
    this.props.data.forEach((d, i) => {
      const dist = Math.abs(geom.px(d) - x)
      if (dist < bestD) { bestD = dist; best = i }
    })
    this.hover = best
  }

  /** `setHover` of the TSX: a value, or an update of the previous one. */
  setHover(value: number | null | ((prev: number | null) => number | null)) {
    this.hover = typeof value === 'function' ? (value as (prev: number | null) => number | null)(this.hover) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type TrendChartStores = ReturnType<TrendChart['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type TrendChartHooks = ReturnType<TrendChart['useHooks']>

export default TrendChart.component()
