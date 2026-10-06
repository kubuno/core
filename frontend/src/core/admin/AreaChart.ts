/**
 * Code-behind of `AreaChart.kbview` (converted from `AreaChart.tsx` by @kubuno/views-migrate).
 */
import { bind } from '@kubuno/views'
import { useRef, useEffect, useCallback } from "react"
import { useUiTheme } from "../hooks/useUiTheme"
import { useWidth, axisTicks, PAD, chartInk, resolveColor } from "./DashboardCharts"

import { ViewBase } from './AreaChart.kbview'
import * as __parts from './AreaChart.parts'

export type AreaChartProps = { data: { label: string; value: number }[]; color?: string; height?: number; unit?: string }

export class AreaChart extends ViewBase {
  @bind accessor hi: number | null = null
  wrap!: AreaChartStores['wrap']
  canvas!: AreaChartStores['canvas']
  W!: number
  theme!: AreaChartStores['theme']
  animated!: AreaChartStores['animated']
  geom!: () => { x0: number; x1: number; y0: number; y1: number; ph: number; xOf: (i: number) => number; yOf: (v: number) => number; }

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const wrap = useRef<HTMLDivElement>(null)
    const canvas = useRef<HTMLCanvasElement>(null)
    const W = useWidth(wrap)
    const theme = useUiTheme()
    const animated = useRef(false)
    return { wrap, canvas, W, theme, animated }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const canvas = this.canvas
    const W = this.W
    const theme = this.theme
    const animated = this.animated
    const geom = useCallback(() => {
      const x0 = PAD.l, x1 = W - PAD.r, y0 = PAD.t, y1 = this.height - PAD.b
      const ph = y1 - y0
      const xOf = (i: number) => x0 + (i / Math.max(1, this.n - 1)) * (x1 - x0)
      const yOf = (v: number) => y1 - (v / this.top) * ph
      return { x0, x1, y0, y1, ph, xOf, yOf }
    }, [W, this.height, this.n, this.top])
    this.publish({ geom })
    const draw = useCallback((p: number, hover: number | null) => {
      const cv = canvas.current
      if (!cv || W === 0 || this.n === 0) return
      const dpr = window.devicePixelRatio || 1
      cv.width = Math.round(W * dpr); cv.height = Math.round(this.height * dpr)
      const ctx = cv.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, this.height)
      const ink = chartInk(cv)
      const paint = resolveColor(cv, this.color)
      const { x0, x1, y1, ph, xOf, yOf } = geom()
      // Grille + axe Y
      ctx.font = '10px system-ui, sans-serif'
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1
      this.ticks.forEach((tk) => {
        const y = y1 - (tk / this.top) * ph
        ctx.strokeStyle = ink.grid; ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(x0, y + 0.5); ctx.lineTo(x1, y + 0.5); ctx.stroke()
        ctx.setLineDash([]); ctx.fillStyle = ink.label
        ctx.fillText(String(tk), x0 - 6, y)
      })
      // Courbe lissée (Catmull-Rom → bézier), animée en hauteur depuis la ligne de base.
      const pts = this.props.data.map((d, i) => [xOf(i), y1 - (y1 - yOf(d.value)) * p] as [number, number])
      const tracePath = () => {
        ctx.beginPath()
        ctx.moveTo(pts[0][0], pts[0][1])
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
          const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
          const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
          ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1])
        }
      }
      // Aire
      tracePath()
      ctx.lineTo(pts[this.n - 1][0], y1); ctx.lineTo(pts[0][0], y1); ctx.closePath()
      const g = ctx.createLinearGradient(0, PAD.t, 0, y1)
      g.addColorStop(0, paint + '4d'); g.addColorStop(1, paint + '05')
      ctx.fillStyle = g; ctx.fill()
      // Ligne
      tracePath()
      ctx.strokeStyle = paint; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke()
      // Crosshair + point survolé
      if (hover !== null) {
        const hx = xOf(hover), hy = yOf(this.props.data[hover].value)
        ctx.strokeStyle = paint + '88'; ctx.setLineDash([4, 4])
        ctx.beginPath(); ctx.moveTo(hx, PAD.t); ctx.lineTo(hx, y1); ctx.stroke(); ctx.setLineDash([])
        ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2)
        // The surface, not white: a dark theme's card is not a white disc.
        ctx.fillStyle = ink.surface; ctx.fill()
        ctx.lineWidth = 2.5; ctx.strokeStyle = paint; ctx.stroke()
      }
    }, [W, this.height, this.props.data, this.ticks, this.top, this.color, this.n, geom])
    const hi = this.hi
    useEffect(() => {
      if (W === 0) return
      if (animated.current) { draw(1, hi); return }
      let raf = 0; const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 600)
        draw(1 - Math.pow(1 - p, 3), null)
        if (p < 1) raf = requestAnimationFrame(tick); else animated.current = true
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
    this.publish({ wrap: s.wrap, canvas: s.canvas, W: s.W, theme: s.theme, animated: s.animated })
    const h = this.useHooks()
    this.publish({ geom: h.geom })
  }

  get color() {
    return this.props.color ?? '#1e8e3e'
  }

  get height() {
    return this.props.height ?? 160
  }

  get top() {
    return (axisTicks(Math.max(...this.props.data.map((d) => d.value), 0))).top
  }

  get ticks() {
    return this.memo('ticks', [this.props], () => (axisTicks(Math.max(...this.props.data.map((d) => d.value), 0))).ticks)
  }

  get n(): number {
    return this.props.data.length
  }

  get tip(): { left: number; top: number; } | null {
    return this.memo('tip', [this.hi, this.geom, this.props], () => this.hi !== null ? { left: this.geom().xOf(this.hi), top: this.geom().yOf(this.props.data[this.hi].value) } : null)
  }

  get part1_props() {
    return this.memo('part1_props', [this.wrap, this.height, this.canvas, this.geom, this.n, this.hi, this.tip, this.props], () => ({ wrap: this.wrap, height: this.height, canvas: this.canvas, onMove: this.onMove.bind(this), setHi: this.setHi.bind(this), tip: this.tip, data: this.props.data, hi: this.hi, unit: this.props.unit }))
  }

  /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
  get Part1() {
    return __parts.Part1
  }

  onMove(e: React.MouseEvent) {
    const { x0, x1 } = this.geom()
    const mx = e.nativeEvent.offsetX
    const i = Math.round(((mx - x0) / Math.max(1, x1 - x0)) * (this.n - 1))
    this.hi = i >= 0 && i < this.n ? i : null
  }

  /** `setHi` of the TSX: a value, or an update of the previous one. */
  setHi(value: number | null | ((prev: number | null) => number | null)) {
    this.hi = typeof value === 'function' ? (value as (prev: number | null) => number | null)(this.hi) : value
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type AreaChartStores = ReturnType<AreaChart['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type AreaChartHooks = ReturnType<AreaChart['useHooks']>

export default AreaChart.component()
