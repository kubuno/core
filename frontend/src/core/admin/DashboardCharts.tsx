// Graphiques SVG natifs pour le tableau de bord admin — zéro dépendance externe.
import { useId } from 'react'

export const CHART_COLORS = ['#1a73e8', '#1e8e3e', '#f9ab00', '#d93025', '#9c27b0', '#0b8043', '#e8710a', '#12b5cb']

/** Octets → chaîne lisible (Ko/Mo/Go…). */
export function fmtBytes(n: number): string {
  if (!n || n < 0) return '0 o'
  const u = ['o', 'Ko', 'Mo', 'Go', 'To', 'Po']
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
  const v = n / Math.pow(1024, i)
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${u[i]}`
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

// ── Donut + légende ───────────────────────────────────────────────────────────
export function DonutChart({
  data, centerValue, centerLabel, size = 150,
}: { data: { label: string; value: number; color: string }[]; centerValue?: string; centerLabel?: string; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const stroke = 18
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f3f4" strokeWidth={stroke} />
          {total > 0 && data.map((d, i) => {
            const frac = d.value / total
            const seg = (
              <circle
                key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={stroke}
                strokeDasharray={`${frac * c} ${c}`} strokeDashoffset={-offset * c}
                style={{ transition: 'stroke-dasharray .6s ease' }}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            )
            offset += frac
            return seg
          })}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-lg font-semibold text-text-primary leading-none">{centerValue}</span>}
            {centerLabel && <span className="text-[10px] text-text-tertiary mt-0.5">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className="flex-1 min-w-0 space-y-1.5">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
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

// ── Histogramme en barres verticales (série journalière) ──────────────────────
export function BarChart({
  data, color = '#1a73e8', height = 120, gradient = true,
}: { data: { label: string; value: number }[]; color?: string; height?: number; gradient?: boolean }) {
  const gid = useId()
  const max = Math.max(1, ...data.map(d => d.value))
  const n = data.length
  const gap = 0.18
  const bw = 100 / n
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`bar-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={gradient ? 0.95 : 1} />
            <stop offset="100%" stopColor={color} stopOpacity={gradient ? 0.55 : 1} />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 4)
          const x = i * bw + bw * gap
          const w = bw * (1 - gap * 2)
          return (
            <g key={i}>
              <rect x={x} y={height - h} width={w} height={h} rx={Math.min(1.4, w / 2.5)} fill={`url(#bar-${gid})`}>
                <title>{`${d.label}: ${d.value}`}</title>
              </rect>
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between mt-1 text-[10px] text-text-tertiary">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(n / 2)]?.label}</span>
        <span>{data[n - 1]?.label}</span>
      </div>
    </div>
  )
}

// ── Aire/ligne lissée (série journalière) ─────────────────────────────────────
export function AreaChart({
  data, color = '#1e8e3e', height = 120,
}: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const gid = useId()
  const n = data.length
  const max = Math.max(1, ...data.map(d => d.value))
  const pts = data.map((d, i) => [(i / Math.max(1, n - 1)) * 100, height - (d.value / max) * (height - 6) - 3])
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
  const area = `${line} L100,${height} L0,${height} Z`
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#area-${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={1.8} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={1.6} fill={color} vectorEffect="non-scaling-stroke">
            <title>{`${data[i].label}: ${data[i].value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-1 text-[10px] text-text-tertiary">
        <span>{data[0]?.label}</span>
        <span>{data[n - 1]?.label}</span>
      </div>
    </div>
  )
}

// ── Liste de barres horizontales (top stockage) ───────────────────────────────
export function HBarList({
  items, color = '#1a73e8',
}: { items: { label: string; value: number; max: number; sub?: string }[]; color?: string }) {
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const pct = it.max > 0 ? Math.min(100, (it.value / it.max) * 100) : 0
        const over = pct >= 90
        return (
          <li key={i}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-secondary truncate flex-1 mr-2">{it.label}</span>
              <span className="text-text-tertiary tabular-nums">{it.sub}</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: over ? '#d93025' : color, transition: 'width .6s ease' }}
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
  if (!data.length) return null
  const max = Math.max(1, ...data)
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * width},${height - (v / max) * (height - 3) - 1.5}`)
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
