/**
 * Code-behind of `BarChart.kbview` (converted from `BarChart.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useRef, useEffect, useCallback } from "react"
import { useUiTheme } from "../hooks/useUiTheme"
import { useWidth, axisTicks, PAD, chartInk, resolveColor } from "./DashboardCharts"

import { ViewBase } from './BarChart.kbview'
import * as __parts from './BarChart.parts'

export type BarChartProps = {
  data: { label: string; value: number }[]
  color?: string
  height?: number
  unit?: string
  /** Writes the category under each bar, thinning them out as far as it must to
   *  keep them from touching. Off by default: where the categories are a series
   *  of days whose exact date adds nothing, the hover tooltip already names the
   *  bar and a row of dates is noise. Turn it on when the reader has to be able
   *  to point at a bar and say *which* one it is — an hour of the day, above
   *  all, is unreadable without it. */
  xLabels?: boolean
}

export class BarChart extends ViewBase {
  @bind accessor hi: number | null = null
  wrap!: BarChartStores['wrap']
  canvas!: BarChartStores['canvas']
  W!: number
  theme!: BarChartStores['theme']
  progress!: BarChartStores['progress']
  animated!: BarChartStores['animated']
  geom!: () => { x0: number; x1: number; y0: number; y1: number; slot: number; ph: number; }

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const wrap = useRef<HTMLDivElement>(null)
    const canvas = useRef<HTMLCanvasElement>(null)
    const W = useWidth(wrap)
    const theme = useUiTheme()
    const progress = useRef(0)
    const animated = useRef(false)
    return { wrap, canvas, W, theme, progress, animated }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const canvas = this.canvas
    const W = this.W
    const theme = this.theme
    const progress = this.progress
    const animated = this.animated
    const geom = useCallback(() => {
      const x0 = PAD.l, x1 = W - PAD.r, y0 = PAD.t, y1 = this.height - PAD.b
      const slot = (x1 - x0) / this.n
      return { x0, x1, y0, y1, slot, ph: y1 - y0 }
    }, [W, this.height, this.n])
    this.publish({ geom })
    const draw = useCallback((p: number, hover: number | null) => {
      const cv = canvas.current
      if (!cv || W === 0) return
      const dpr = window.devicePixelRatio || 1
      cv.width = Math.round(W * dpr); cv.height = Math.round(this.height * dpr)
      const ctx = cv.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, this.height)
      const ink = chartInk(cv)
      const paint = resolveColor(cv, this.color)
      const { x0, x1, y1, slot, ph } = geom()
      // Grille + axe Y
      ctx.font = '10px system-ui, sans-serif'
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      ctx.lineWidth = 1
      this.ticks.forEach((tk) => {
        const y = y1 - (tk / this.top) * ph
        ctx.strokeStyle = ink.grid
        ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(x0, y + 0.5); ctx.lineTo(x1, y + 0.5); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = ink.label
        ctx.fillText(String(tk), x0 - 6, y)
      })
      // Barres
      const bw = Math.min(slot * 0.62, 46)
      this.props.data.forEach((d, i) => {
        const h = (d.value / this.top) * ph * p
        const cx = x0 + (i + 0.5) * slot
        const x = cx - bw / 2
        const y = y1 - h
        const isHi = hover === i
        const g = ctx.createLinearGradient(0, y, 0, y1)
        g.addColorStop(0, paint)
        g.addColorStop(1, paint + (isHi ? 'cc' : '99'))
        ctx.fillStyle = g
        const r = Math.min(4, bw / 2)
        ctx.beginPath()
        ctx.moveTo(x, y1); ctx.lineTo(x, y + r)
        ctx.arcTo(x, y, x + r, y, r)
        ctx.lineTo(x + bw - r, y); ctx.arcTo(x + bw, y, x + bw, y + r, r)
        ctx.lineTo(x + bw, y1); ctx.closePath()
        if (isHi) { ctx.shadowColor = this.color + '55'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2 }
        ctx.fill()
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
      })
      // Axe X. Le pas est mesuré, pas deviné : on n'écrit qu'une étiquette sur
      // `step` pour qu'aucune n'en touche une autre, quelle que soit la largeur.
      if (this.xLabels && this.props.data.length) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'
        ctx.fillStyle = ink.label
        const widest = Math.max(...this.props.data.map((d) => ctx.measureText(d.label).width))
        const step = Math.max(1, Math.ceil((widest + 8) / slot))
        this.props.data.forEach((d, i) => {
          if (i % step) return
          ctx.fillText(d.label, x0 + (i + 0.5) * slot, y1 + 5)
        })
      }
    }, [W, this.height, this.props.data, this.ticks, this.top, this.color, geom, this.xLabels])
    const hi = this.hi
    useEffect(() => {
      if (W === 0) return
      if (animated.current) { draw(1, hi); return }
      let raf = 0; const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 550)
        progress.current = 1 - Math.pow(1 - p, 3) // ease-out cubic
        draw(progress.current, null)
        if (p < 1) raf = requestAnimationFrame(tick)
        else animated.current = true
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, [W, draw])
    useEffect(() => { if (animated.current) draw(1, hi) }, [hi, theme, draw])
    return { geom, draw }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ wrap: s.wrap, canvas: s.canvas, W: s.W, theme: s.theme, progress: s.progress, animated: s.animated })
    const h = this.useHooks()
    this.publish({ geom: h.geom })
  }

  get color() {
    return this.props.color ?? '#1a73e8'
  }

  get height() {
    return this.props.height ?? 160
  }

  get xLabels() {
    return this.props.xLabels ?? false
  }

  get top() {
    return (axisTicks(Math.max(...this.props.data.map((d) => d.value), 0))).top
  }

  get ticks() {
    return this.memo('ticks', [this.props], () => (axisTicks(Math.max(...this.props.data.map((d) => d.value), 0))).ticks)
  }

  get n(): number {
    return this.props.data.length || 1
  }

  get tip(): { left: number; top: number; } | null {
    return this.memo('tip', [this.geom, this.props, this.top, this.hi], () => {
      const hi = this.hi
      return hi !== null ? (() => {
    const { x0, y1, slot, ph } = this.geom()
    return { left: x0 + (hi + 0.5) * slot, top: y1 - (this.props.data[hi].value / this.top) * ph }
  })() : null
    })
  }

  get part1_props() {
    return this.memo('part1_props', [this.wrap, this.height, this.canvas, this.geom, this.hi, this.n, this.tip, this.props], () => ({ wrap: this.wrap, height: this.height, canvas: this.canvas, onMove: this.onMove.bind(this), setHi: this.setHi.bind(this), tip: this.tip, data: this.props.data, hi: this.hi, unit: this.props.unit }))
  }

  /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
  get Part1() {
    return __parts.Part1
  }

  onMove(e: React.MouseEvent) {
    const { x0, slot } = this.geom()
    const mx = e.nativeEvent.offsetX
    const i = Math.floor((mx - x0) / slot)
    this.hi = i >= 0 && i < this.n ? i : null
  }

  /** `setHi` of the TSX: a value, or an update of the previous one. */
  setHi(value: number | null | ((prev: number | null) => number | null)) {
    this.hi = typeof value === 'function' ? (value as (prev: number | null) => number | null)(this.hi) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type BarChartStores = ReturnType<BarChart['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type BarChartHooks = ReturnType<BarChart['useHooks']>

export default BarChart.component()
