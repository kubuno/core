// Graphiques du tableau de bord admin — zéro dépendance externe.
// Séries temporelles dessinées en CANVAS (HiDPI, animées, interactives :
// survol, surbrillance, crosshair, tooltip) ; donut/jauge en SVG (net, rond).
import { useId, useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { useUiTheme } from '../hooks/useUiTheme'

export const CHART_COLORS = ['#1a73e8', '#1e8e3e', '#f9ab00', '#d93025', '#9c27b0', '#0b8043', '#e8710a', '#12b5cb']

/**
 * The categorical scale, as theme VARIABLES rather than literals.
 *
 * `CHART_COLORS` above is the historical literal set, still used by the general
 * dashboard. Anything drawn for both themes takes this one instead: the dark
 * steps are a separately-validated set, not a filter over the light ones, and
 * the choice is made in JS because Kubuno applies themes by writing variables,
 * not through `prefers-color-scheme` (see `theme.css`).
 */
export const CHART_SERIES_LIGHT = [
  'var(--kb-chart-1)', 'var(--kb-chart-2)', 'var(--kb-chart-3)', 'var(--kb-chart-4)',
  'var(--kb-chart-5)', 'var(--kb-chart-6)', 'var(--kb-chart-7)', 'var(--kb-chart-8)',
] as const

export const CHART_SERIES_DARK = [
  'var(--kb-chart-1-dark)', 'var(--kb-chart-2-dark)', 'var(--kb-chart-3-dark)', 'var(--kb-chart-4-dark)',
  'var(--kb-chart-5-dark)', 'var(--kb-chart-6-dark)', 'var(--kb-chart-7-dark)', 'var(--kb-chart-8-dark)',
] as const

/** The categorical scale for the theme actually in force. */
export function useChartSeries(): readonly string[] {
  return useUiTheme() === 'dark' ? CHART_SERIES_DARK : CHART_SERIES_LIGHT
}

// ── Reading theme variables from a canvas ────────────────────────────────────
//
// A canvas composites literal colours: `var(--…)` means nothing to
// `ctx.fillStyle`. Everything painted below therefore RESOLVES its variables
// against the live element at draw time, which is also what makes a theme switch
// (a rewrite of those variables) repaint correctly — the draw effects depend on
// `useUiTheme()` so they run again when it happens.

/** Last-resort ink, used only if a theme forgot to define a variable at all. */
const FALLBACK_INK = '#5f6368'

function cssVar(el: Element | null, name: string, fallback: string): string {
  if (!el) return fallback
  const v = getComputedStyle(el).getPropertyValue(name).trim()
  return v || fallback
}

/**
 * A CSS colour expression → the literal the canvas can paint.
 *
 * Accepts either a literal (returned as-is) or a single `var(--token)`. The
 * resolved value is a 6-digit hex in every theme Kubuno ships, which is what
 * lets the callers below append an alpha pair to it.
 */
function resolveColor(el: Element | null, color: string): string {
  const m = /^var\(\s*(--[\w-]+)\s*\)$/.exec(color)
  return m ? cssVar(el, m[1], FALLBACK_INK) : color
}

/** The chrome every canvas chart paints: grid, tick labels, surface. */
function chartInk(el: Element | null) {
  return {
    grid:    cssVar(el, '--color-border', '#eceef1'),
    label:   cssVar(el, '--color-text-tertiary', FALLBACK_INK),
    surface: cssVar(el, '--color-surface-0', '#ffffff'),
  }
}

/** Octets → chaîne lisible (Ko/Mo/Go…). */
export function fmtBytes(n: number): string {
  if (!n || n < 0) return '0 o'
  const u = ['o', 'Ko', 'Mo', 'Go', 'To', 'Po']
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
  const v = n / Math.pow(1024, i)
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${u[i]}`
}

// Arrondit à un « joli » palier (1/2/5 × 10ⁿ) pour l'échelle des axes.
function niceCeil(v: number): number {
  if (v <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / pow
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow
}

// Graduations entières et régulières de l'axe Y (0 → max arrondi).
function axisTicks(max: number): { top: number; ticks: number[] } {
  const nm = niceCeil(Math.max(1, max))
  const step = nm <= 5 ? 1 : niceCeil(nm / 4)
  const ticks: number[] = []
  for (let v = 0; v <= nm + 1e-9; v += step) ticks.push(Math.round(v))
  const uniq = [...new Set(ticks)]
  return { top: uniq[uniq.length - 1], ticks: uniq }
}

// Largeur responsive d'un conteneur (ResizeObserver).
function useWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}

// ── Tooltip flottant (HTML, positionné en pixels) ─────────────────────────────
function Tip({ left, top, children }: { left: number; top: number; children: ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-lg bg-[#202124] px-2.5 py-1.5 text-[11px] leading-tight text-white shadow-lg whitespace-nowrap"
      style={{ left, top, transform: 'translate(-50%, calc(-100% - 8px))' }}
    >
      {children}
      <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-[#202124]" />
    </div>
  )
}

const PAD = { l: 38, r: 8, t: 10, b: 20 }

// ── Histogramme en barres (canvas, animé + interactif) ────────────────────────
export function BarChart({
  data, color = '#1a73e8', height = 160, unit,
}: { data: { label: string; value: number }[]; color?: string; height?: number; unit?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const W = useWidth(wrap)
  const theme = useUiTheme()
  const [hi, setHi] = useState<number | null>(null)
  const progress = useRef(0)
  const animated = useRef(false)
  const { top, ticks } = axisTicks(Math.max(...data.map((d) => d.value), 0))
  const n = data.length || 1

  const geom = useCallback(() => {
    const x0 = PAD.l, x1 = W - PAD.r, y0 = PAD.t, y1 = height - PAD.b
    const slot = (x1 - x0) / n
    return { x0, x1, y0, y1, slot, ph: y1 - y0 }
  }, [W, height, n])

  const draw = useCallback((p: number, hover: number | null) => {
    const cv = canvas.current
    if (!cv || W === 0) return
    const dpr = window.devicePixelRatio || 1
    cv.width = Math.round(W * dpr); cv.height = Math.round(height * dpr)
    const ctx = cv.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, height)
    const ink = chartInk(cv)
    const paint = resolveColor(cv, color)
    const { x0, x1, y1, slot, ph } = geom()
    // Grille + axe Y
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
    ctx.lineWidth = 1
    ticks.forEach((tk) => {
      const y = y1 - (tk / top) * ph
      ctx.strokeStyle = ink.grid
      ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(x0, y + 0.5); ctx.lineTo(x1, y + 0.5); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = ink.label
      ctx.fillText(String(tk), x0 - 6, y)
    })
    // Barres
    const bw = Math.min(slot * 0.62, 46)
    data.forEach((d, i) => {
      const h = (d.value / top) * ph * p
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
      if (isHi) { ctx.shadowColor = color + '55'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2 }
      ctx.fill()
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
    })
  }, [W, height, data, ticks, top, color, geom])

  // Animation d'apparition (une seule fois), sinon dessin direct.
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
  }, [W, draw]) // eslint-disable-line react-hooks/exhaustive-deps

  // `theme` is a dependency, not a stray: a theme switch rewrites the variables
  // the canvas resolved at its last paint, and a canvas does not reflow.
  useEffect(() => { if (animated.current) draw(1, hi) }, [hi, theme, draw])

  const onMove = (e: React.MouseEvent) => {
    const { x0, slot } = geom()
    const mx = e.nativeEvent.offsetX
    const i = Math.floor((mx - x0) / slot)
    setHi(i >= 0 && i < n ? i : null)
  }

  const tip = hi !== null ? (() => {
    const { x0, y1, slot, ph } = geom()
    return { left: x0 + (hi + 0.5) * slot, top: y1 - (data[hi].value / top) * ph }
  })() : null

  return (
    <div ref={wrap} className="relative" style={{ height }}>
      <canvas ref={canvas} style={{ width: '100%', height }} onMouseMove={onMove} onMouseLeave={() => setHi(null)} />
      {tip && (
        <Tip left={tip.left} top={tip.top}>
          <div className="font-medium">{data[hi!].value}{unit ? ` ${unit}` : ''}</div>
          <div className="text-white/60">{data[hi!].label}</div>
        </Tip>
      )}
    </div>
  )
}

// ── Courbe / aire lissée (canvas, animée + crosshair) ─────────────────────────
export function AreaChart({
  data, color = '#1e8e3e', height = 160, unit,
}: { data: { label: string; value: number }[]; color?: string; height?: number; unit?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const W = useWidth(wrap)
  const theme = useUiTheme()
  const [hi, setHi] = useState<number | null>(null)
  const animated = useRef(false)
  const { top, ticks } = axisTicks(Math.max(...data.map((d) => d.value), 0))
  const n = data.length

  const geom = useCallback(() => {
    const x0 = PAD.l, x1 = W - PAD.r, y0 = PAD.t, y1 = height - PAD.b
    const ph = y1 - y0
    const xOf = (i: number) => x0 + (i / Math.max(1, n - 1)) * (x1 - x0)
    const yOf = (v: number) => y1 - (v / top) * ph
    return { x0, x1, y0, y1, ph, xOf, yOf }
  }, [W, height, n, top])

  const draw = useCallback((p: number, hover: number | null) => {
    const cv = canvas.current
    if (!cv || W === 0 || n === 0) return
    const dpr = window.devicePixelRatio || 1
    cv.width = Math.round(W * dpr); cv.height = Math.round(height * dpr)
    const ctx = cv.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, height)
    const ink = chartInk(cv)
    const paint = resolveColor(cv, color)
    const { x0, x1, y1, ph, xOf, yOf } = geom()
    // Grille + axe Y
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1
    ticks.forEach((tk) => {
      const y = y1 - (tk / top) * ph
      ctx.strokeStyle = ink.grid; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(x0, y + 0.5); ctx.lineTo(x1, y + 0.5); ctx.stroke()
      ctx.setLineDash([]); ctx.fillStyle = ink.label
      ctx.fillText(String(tk), x0 - 6, y)
    })
    // Courbe lissée (Catmull-Rom → bézier), animée en hauteur depuis la ligne de base.
    const pts = data.map((d, i) => [xOf(i), y1 - (y1 - yOf(d.value)) * p] as [number, number])
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
    ctx.lineTo(pts[n - 1][0], y1); ctx.lineTo(pts[0][0], y1); ctx.closePath()
    const g = ctx.createLinearGradient(0, PAD.t, 0, y1)
    g.addColorStop(0, paint + '4d'); g.addColorStop(1, paint + '05')
    ctx.fillStyle = g; ctx.fill()
    // Ligne
    tracePath()
    ctx.strokeStyle = paint; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke()
    // Crosshair + point survolé
    if (hover !== null) {
      const hx = xOf(hover), hy = yOf(data[hover].value)
      ctx.strokeStyle = paint + '88'; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(hx, PAD.t); ctx.lineTo(hx, y1); ctx.stroke(); ctx.setLineDash([])
      ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2)
      // The surface, not white: a dark theme's card is not a white disc.
      ctx.fillStyle = ink.surface; ctx.fill()
      ctx.lineWidth = 2.5; ctx.strokeStyle = paint; ctx.stroke()
    }
  }, [W, height, data, ticks, top, color, n, geom])

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
  }, [W, draw]) // eslint-disable-line react-hooks/exhaustive-deps

  // See the note on the bar chart: a theme switch has to repaint the canvas.
  useEffect(() => { if (animated.current) draw(1, hi) }, [hi, theme, draw])

  const onMove = (e: React.MouseEvent) => {
    const { x0, x1 } = geom()
    const mx = e.nativeEvent.offsetX
    const i = Math.round(((mx - x0) / Math.max(1, x1 - x0)) * (n - 1))
    setHi(i >= 0 && i < n ? i : null)
  }
  const tip = hi !== null ? { left: geom().xOf(hi), top: geom().yOf(data[hi].value) } : null

  return (
    <div ref={wrap} className="relative" style={{ height }}>
      <canvas ref={canvas} style={{ width: '100%', height }} onMouseMove={onMove} onMouseLeave={() => setHi(null)} />
      {tip && (
        <Tip left={tip.left} top={tip.top}>
          <div className="font-medium">{data[hi!].value}{unit ? ` ${unit}` : ''}</div>
          <div className="text-white/60">{data[hi!].label}</div>
        </Tip>
      )}
    </div>
  )
}

// ── Jauge circulaire (anneau de progression) ──────────────────────────────────
export function ProgressRing({
  pct, label, value, sub, color = '#1a73e8', size = 132,
}: { pct: number; label?: string; value: string; sub?: string; color?: string; size?: number }) {
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c}
            strokeDashoffset={c - (clamped / 100) * c}
            style={{ transition: 'stroke-dashoffset .6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-text-primary leading-none">{value}</span>
          {label && <span className="text-[11px] text-text-tertiary mt-1">{label}</span>}
        </div>
      </div>
      {sub && <span className="text-sm text-text-secondary mt-2">{sub}</span>}
    </div>
  )
}

// ── Donut + légende (survol synchronisé arc ↔ légende) ────────────────────────
export function DonutChart({
  data, centerValue, centerLabel, size = 150,
}: { data: { label: string; value: number; color: string }[]; centerValue?: string; centerLabel?: string; size?: number }) {
  const [hi, setHi] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const stroke = 18
  const r = (size - stroke - 6) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  const active = hi !== null ? data[hi] : null
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }} onMouseLeave={() => setHi(null)}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={stroke} />
          {total > 0 && data.map((d, i) => {
            const frac = d.value / total
            const dim = hi !== null && hi !== i
            const seg = (
              <circle
                key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color}
                strokeWidth={hi === i ? stroke + 5 : stroke}
                strokeDasharray={`${frac * c} ${c}`} strokeDashoffset={-offset * c}
                opacity={dim ? 0.35 : 1}
                style={{ transition: 'stroke-width .15s ease, opacity .15s ease', cursor: 'pointer' }}
                onMouseEnter={() => setHi(i)}
              />
            )
            offset += frac
            return seg
          })}
        </svg>
        {/* The hole of a ring is a fixed, small circle: a segment name never fits
            in it, and truncating one there produced a clipped grey string lying
            across the arc. The legend beside it already carries every name, and
            the row of the hovered segment is highlighted — so the centre states
            the NUMBER, and on hover its share. Two facts that always fit. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-[18%] text-center">
          <span className="font-semibold text-text-primary leading-none"
            style={{ fontSize: 'var(--kb-text-title)' }}>
            {active ? active.value : (centerValue ?? total)}
          </span>
          <span className="mt-1 leading-tight text-text-tertiary"
            style={{ fontSize: 'var(--kb-text-meta)' }}>
            {active
              ? `${total > 0 ? Math.round((active.value / total) * 100) : 0} %`
              : (centerLabel ?? '')}
          </span>
        </div>
      </div>
      <ul className="flex-1 min-w-0 space-y-1">
        {data.map((d, i) => (
          <li
            key={i}
            className={`flex items-center gap-2 text-sm rounded-md px-1.5 py-1 -mx-1.5 cursor-default transition-colors ${hi === i ? 'bg-surface-1' : ''}`}
            onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}
          >
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
            <span className="text-text-secondary truncate flex-1">{d.label}</span>
            <span className="text-text-primary font-medium tabular-nums">{d.value}</span>
            <span className="text-text-tertiary tabular-nums w-9 text-right">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Liste de barres horizontales (top stockage), avec survol ──────────────────
export function HBarList({
  items, color = '#1a73e8',
}: {
  /** `color` per item overrides the list's own — a printed report ties each bar
      to the slice and to the table row that carry the same entry. */
  items: { label: string; value: number; max: number; sub?: string; color?: string }[]
  color?: string
}) {
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const pct = it.max > 0 ? Math.min(100, (it.value / it.max) * 100) : 0
        const over = pct >= 90
        return (
          <li key={i} className="group">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-text-secondary truncate flex-1 mr-2 group-hover:text-text-primary transition-colors">{it.label}</span>
              <span className="text-text-tertiary tabular-nums">{it.sub}</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden" title={`${Math.round(pct)} %`}>
              {/* A flat fill rather than a gradient: `${color}cc` only composes
                  when `color` is a literal hex, and silently voids the whole
                  background when it is a theme variable. */}
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: over ? 'var(--color-danger)' : (it.color ?? color), transition: 'width .6s ease' }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Série chronologique en SVG (pour les rapports imprimables) ────────────────

/**
 * The same series as {@link BarChart} and {@link AreaChart}, drawn in SVG.
 *
 * ## Why a second implementation, and only for reports
 *
 * A `<canvas>` is a BITMAP composited at draw time. Two consequences a printed
 * report cannot live with:
 *
 *   • It resolves its theme variables when it paints (see the note at the top of
 *     this file). Under a dark theme the axis labels are painted in the dark
 *     theme's pale ink — and printing does not repaint a canvas, so a print
 *     stylesheet forcing black text has no effect whatsoever on it. The chart
 *     comes out as pale grey on white, or invisible.
 *   • It is rasterised at the screen's pixel ratio, then scaled to the printer's
 *     much higher one. A 132-pixel-tall chart enlarged to a page width prints
 *     visibly soft.
 *
 * SVG has neither problem: it is part of the document, so `@media print` reaches
 * it, and it is resolution-independent. The interactive charts stay on canvas —
 * they are hovered, animated and redrawn constantly, which is the one thing
 * canvas is better at — and reports take this one.
 *
 * ## No measurement, deliberately
 *
 * There is no `ResizeObserver` here. The drawing is laid out in a fixed
 * `viewBox` and scaled by CSS, so it needs no width to render — which matters
 * because the browser lays a page out again for the printer, and a chart that
 * waits for an observer to fire can be measured at zero on the sheet it is being
 * printed onto.
 */
export function ReportSeriesChart({
  data, color = 'var(--kb-chart-1)', shape = 'bars', unit,
}: {
  data:   { label: string; value: number }[]
  color?: string
  /** `bars` for counts of discrete events, `area` for continuous activity. */
  shape?: 'bars' | 'area'
  /** Spells a value in the panel's own unit (counts, or bytes). */
  unit?:  (v: number) => string
}) {
  const gid = useId()
  // A fixed drawing surface: the printed sheet and the screen show the same
  // geometry, only at different sizes.
  const W = 800, H = 280
  const pad = { l: 74, r: 12, t: 14, b: 46 }
  const x0 = pad.l, x1 = W - pad.r, y0 = pad.t, y1 = H - pad.b
  const plotW = x1 - x0, plotH = y1 - y0

  const n = data.length
  if (n === 0) return null

  const { top, ticks } = axisTicks(Math.max(...data.map(d => d.value), 0))
  const yOf = (v: number) => y1 - (v / top) * plotH

  // At most a dozen labels on the axis: forty daily dates printed side by side
  // are a grey band, not a reading. The rows below the chart carry every one.
  const every = Math.max(1, Math.ceil(n / 12))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      className="w-full text-text-tertiary"
      style={{ height: 'auto' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`rep-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0.04} />
        </linearGradient>
      </defs>

      {/* Grid and the value axis.
          The rules take the theme's own border colour rather than the ink at a
          reduced opacity: an alpha over a theme colour composites against
          whatever is behind it, which is a different surface in each theme and
          white on paper. The LABELS take `currentColor`, so one print rule on
          the container blackens them. */}
      {ticks.map(tk => (
        <g key={tk}>
          <line
            x1={x0} x2={x1} y1={yOf(tk)} y2={yOf(tk)}
            stroke="var(--color-border)" strokeDasharray="3 3"
          />
          <text
            x={x0 - 8} y={yOf(tk)} textAnchor="end" dominantBaseline="middle"
            fontSize={14} fill="currentColor"
          >
            {unit ? unit(tk) : tk}
          </text>
        </g>
      ))}

      {shape === 'area' ? (() => {
        const xOf = (i: number) => x0 + (i / Math.max(1, n - 1)) * plotW
        const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d.value).toFixed(1)}`).join(' ')
        return (
          <>
            <path d={`${line} L${xOf(n - 1)},${y1} L${xOf(0)},${y1} Z`} fill={`url(#rep-${gid})`} />
            <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
          </>
        )
      })() : (() => {
        const slot = plotW / n
        const bw = Math.min(slot * 0.66, 46)
        return data.map((d, i) => {
          const h = (d.value / top) * plotH
          return (
            <rect
              key={i} x={x0 + (i + 0.5) * slot - bw / 2} y={y1 - h}
              width={bw} height={Math.max(0, h)} rx={2} fill={color}
            />
          )
        })
      })()}

      {/* The baseline, and the instants under it. */}
      <line x1={x0} x2={x1} y1={y1} y2={y1} stroke="var(--color-border-strong)" />
      {data.map((d, i) => {
        if (i % every !== 0) return null
        const x = shape === 'area'
          ? x0 + (i / Math.max(1, n - 1)) * plotW
          : x0 + (i + 0.5) * (plotW / n)
        return (
          <text
            key={i} x={x} y={y1 + 22} textAnchor="middle" fontSize={14} fill="currentColor"
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

// ── Sparkline (mini-courbe dans une carte) ────────────────────────────────────
export function Sparkline({ data, color = '#1a73e8', width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const gid = useId()
  if (!data.length) return null
  const max = Math.max(1, ...data)
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * width, height - (v / max) * (height - 3) - 1.5])
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#spark-${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
