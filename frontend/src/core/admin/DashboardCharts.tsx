// Graphiques du tableau de bord admin — zéro dépendance externe.
// Séries temporelles dessinées en CANVAS (HiDPI, animées, interactives :
// survol, surbrillance, crosshair, tooltip) ; donut/jauge en SVG (net, rond).
import { useId, useState, useRef, useEffect, useCallback, type ReactNode } from 'react'

export const CHART_COLORS = ['#1a73e8', '#1e8e3e', '#f9ab00', '#d93025', '#9c27b0', '#0b8043', '#e8710a', '#12b5cb']

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

const TEXT_TERTIARY = '#80868b'
const GRID = '#eceef1'

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
    const { x0, x1, y1, slot, ph } = geom()
    // Grille + axe Y
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
    ctx.lineWidth = 1
    ticks.forEach((tk) => {
      const y = y1 - (tk / top) * ph
      ctx.strokeStyle = GRID
      ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(x0, y + 0.5); ctx.lineTo(x1, y + 0.5); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = TEXT_TERTIARY
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
      g.addColorStop(0, color)
      g.addColorStop(1, color + (isHi ? 'cc' : '99'))
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

  useEffect(() => { if (animated.current) draw(1, hi) }, [hi, draw])

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
    const { x0, x1, y1, ph, xOf, yOf } = geom()
    // Grille + axe Y
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1
    ticks.forEach((tk) => {
      const y = y1 - (tk / top) * ph
      ctx.strokeStyle = GRID; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(x0, y + 0.5); ctx.lineTo(x1, y + 0.5); ctx.stroke()
      ctx.setLineDash([]); ctx.fillStyle = TEXT_TERTIARY
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
    g.addColorStop(0, color + '4d'); g.addColorStop(1, color + '05')
    ctx.fillStyle = g; ctx.fill()
    // Ligne
    tracePath()
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke()
    // Crosshair + point survolé
    if (hover !== null) {
      const hx = xOf(hover), hy = yOf(data[hover].value)
      ctx.strokeStyle = color + '88'; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(hx, PAD.t); ctx.lineTo(hx, y1); ctx.stroke(); ctx.setLineDash([])
      ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'; ctx.fill()
      ctx.lineWidth = 2.5; ctx.strokeStyle = color; ctx.stroke()
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

  useEffect(() => { if (animated.current) draw(1, hi) }, [hi, draw])

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
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8eaed" strokeWidth={stroke} />
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
      {sub && <span className="text-xs text-text-secondary mt-2">{sub}</span>}
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
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f3f4" strokeWidth={stroke} />
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-text-primary leading-none">
            {active ? active.value : (centerValue ?? total)}
          </span>
          <span className="text-[10px] text-text-tertiary mt-0.5 max-w-[80%] truncate text-center">
            {active ? active.label : (centerLabel ?? '')}
          </span>
        </div>
      </div>
      <ul className="flex-1 min-w-0 space-y-1">
        {data.map((d, i) => (
          <li
            key={i}
            className={`flex items-center gap-2 text-xs rounded-md px-1.5 py-1 -mx-1.5 cursor-default transition-colors ${hi === i ? 'bg-surface-1' : ''}`}
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
}: { items: { label: string; value: number; max: number; sub?: string }[]; color?: string }) {
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const pct = it.max > 0 ? Math.min(100, (it.value / it.max) * 100) : 0
        const over = pct >= 90
        return (
          <li key={i} className="group">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-secondary truncate flex-1 mr-2 group-hover:text-text-primary transition-colors">{it.label}</span>
              <span className="text-text-tertiary tabular-nums">{it.sub}</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden" title={`${Math.round(pct)} %`}>
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: over ? '#d93025' : `linear-gradient(90deg, ${color}cc, ${color})`, transition: 'width .6s ease' }}
              />
            </div>
          </li>
        )
      })}
    </ul>
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
