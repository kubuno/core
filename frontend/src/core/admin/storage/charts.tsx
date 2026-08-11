import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useUiTheme } from '../../hooks/useUiTheme'
import { formatBytes } from '../sections/format'

/**
 * The two figures this page draws, and nothing else.
 *
 * ## Colour
 *
 * Everything resolves through a theme variable — `var(--color-primary)`,
 * `var(--color-success)`, `var(--color-border)`. No hex is written down, so a
 * theme that remaps its variables recolours both charts, dark mode included.
 *
 * `fill-opacity` on an SVG shape is deliberate and is NOT the banned pattern:
 * the ban is on Tailwind's colour-opacity modifiers (`bg-primary/10`), which
 * compile to a `color-mix()` carrying a **static light-theme hex** as its
 * fallback. An SVG `fill-opacity` composites the *resolved* variable at paint
 * time, so it follows the theme like any other use of the token.
 *
 * ## Marks
 *
 * 2px lines, ≥8px end markers ringed in the surface colour, hairline solid
 * gridlines one step off the surface, a 2px surface gap between touching
 * segments. Values are never printed on every point: the axis, the end label and
 * the hover read-out carry them, and the figures beside each chart repeat the
 * ones that matter so nothing is reachable only through a tooltip.
 */

/** Container width, tracked so a chart reflows on a phone and in a split pane. */
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

// ── The categorical scale ────────────────────────────────────────────────────

/**
 * Slots of the categorical scale, in fixed order. Never cycled.
 *
 * Written out in full rather than composed from an index: Tailwind prunes
 * `@theme` variables it cannot see referenced in the source, so a name built at
 * runtime (`--kb-chart-${n}`) resolves to a variable that was never emitted.
 *
 * The dark steps are a separate, separately-validated set rather than a filter
 * over the light ones, and the choice is made in JS: Kubuno's themes are applied
 * by writing variables from the theme store, not through `prefers-color-scheme`,
 * so a CSS-only switch would stay light on a hand-picked dark theme.
 */
export const SERIES_LIGHT = [
  'var(--kb-chart-1)', 'var(--kb-chart-2)', 'var(--kb-chart-3)', 'var(--kb-chart-4)',
  'var(--kb-chart-5)', 'var(--kb-chart-6)', 'var(--kb-chart-7)', 'var(--kb-chart-8)',
] as const

export const SERIES_DARK = [
  'var(--kb-chart-1-dark)', 'var(--kb-chart-2-dark)', 'var(--kb-chart-3-dark)', 'var(--kb-chart-4-dark)',
  'var(--kb-chart-5-dark)', 'var(--kb-chart-6-dark)', 'var(--kb-chart-7-dark)', 'var(--kb-chart-8-dark)',
] as const

/** Beyond this many series, the tail folds into one entry. Never a ninth hue. */
export const MAX_SERIES = SERIES_LIGHT.length

/** The scale for the theme actually in force. */
export function useSeriesScale(): readonly string[] {
  return useUiTheme() === 'dark' ? SERIES_DARK : SERIES_LIGHT
}

/** The colour of what has no identity: a residual, a fold, an unknown. */
export const NEUTRAL_SERIES = 'var(--color-border-strong)'

// ── Composition bar ──────────────────────────────────────────────────────────

export interface Segment {
  id:    string
  label: string
  value: number
  /** A CSS colour *expression* — always `var(--…)`, never a literal. */
  color: string
  /**
   * The remainder, not a part: it is left as bare track rather than painted.
   *
   * "Free space" is what the bar has not filled, and painting it in a near-track
   * grey produces two adjacent light greys nobody can tell apart. It keeps its
   * legend entry — the number is the point — with a hairline ring so the swatch
   * is visible against the card.
   */
  track?: boolean
}

/**
 * One horizontal bar split into parts of a whole, with its legend underneath.
 *
 * Used for the two part-to-whole readings the page has real numbers for: what
 * fills the data volume, and how the accounts split across quota states. A
 * segment narrower than the gap is dropped from the bar rather than rendered as
 * a sliver that reads as a rendering artefact — its number stays in the legend,
 * which is where it is read anyway.
 */
export function CompositionBar({
  segments, total, ariaLabel, format = formatBytes,
}: {
  segments:  Segment[]
  total:     number
  ariaLabel: string
  format?:   (n: number) => string
}) {
  const safeTotal = total > 0 ? total : 1
  // A segment thinner than the gap that separates it reads as a rendering
  // artefact rather than as a value; its number stays in the legend below.
  const visible = segments.filter(s => !s.track && s.value / safeTotal >= 0.005)

  return (
    <div>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2"
        role="img"
        aria-label={ariaLabel}
      >
        {visible.map((s, i) => (
          <div
            key={s.id}
            // The 2px separator is surface-coloured space, never a border: a
            // stroke around a mark adds ink that is not data.
            style={{
              width:           `${(s.value / safeTotal) * 100}%`,
              backgroundColor: s.color,
              marginLeft:      i === 0 ? 0 : 2,
            }}
          />
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map(s => (
          <li key={s.id} className="flex min-w-0 items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: s.color,
                // The track swatch is a light grey on a light card: without the
                // ring it is a blank space where a key should be.
                boxShadow: s.track ? 'inset 0 0 0 1px var(--color-border-strong)' : undefined,
              }}
              aria-hidden
            />
            <span className="min-w-0 truncate text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {s.label}
            </span>
            <span className="shrink-0 tabular-nums text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {format(s.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Trend ────────────────────────────────────────────────────────────────────

export interface TrendDatum { day: string; value: number }

const PAD = { l: 52, r: 12, t: 12, b: 22 }

/** A round-ish ceiling so the axis reads 0 / 2 Go / 4 Go rather than 0 / 1.87 Go. */
function niceCeil(v: number): number {
  if (v <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(v))
  const f = v / pow
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow
}

/**
 * A single-series line over time. No legend — one series, and the card title
 * already names it.
 *
 * Days with no sample are absent from `data` rather than zero-filled: a core
 * that was switched off for a week measured nothing that week, and drawing a
 * dip to zero would report a mass deletion that never happened. Points are laid
 * out by their **date**, so a gap in the samples is a gap on the axis.
 */
export function TrendChart({
  data, height = 180, label,
}: {
  data:    TrendDatum[]
  height?: number
  label:   string
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const width = useWidth(wrap)
  const [hover, setHover] = useState<number | null>(null)

  const geom = useMemo(() => {
    if (data.length < 2 || width === 0) return null
    const t0 = new Date(data[0].day).getTime()
    const t1 = new Date(data[data.length - 1].day).getTime()
    const span = Math.max(t1 - t0, 1)
    const top = niceCeil(Math.max(...data.map(d => d.value), 1))
    const x0 = PAD.l, x1 = Math.max(width - PAD.r, PAD.l + 1)
    const y0 = PAD.t, y1 = height - PAD.b
    const px = (d: TrendDatum) => x0 + ((new Date(d.day).getTime() - t0) / span) * (x1 - x0)
    const py = (v: number) => y1 - (v / top) * (y1 - y0)
    return { t0, span, top, x0, x1, y0, y1, px, py }
  }, [data, width, height])

  const ticks = useMemo(() => {
    if (!geom) return []
    return [0, 0.25, 0.5, 0.75, 1].map(f => geom.top * f)
  }, [geom])

  const points = geom ? data.map(d => `${geom.px(d)},${geom.py(d.value)}`).join(' ') : ''
  const area = geom
    ? `M ${geom.px(data[0])},${geom.y1} L ${points.split(' ').join(' L ')} L ${geom.px(data[data.length - 1])},${geom.y1} Z`
    : ''

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!geom) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let best = 0
    let bestD = Infinity
    data.forEach((d, i) => {
      const dist = Math.abs(geom.px(d) - x)
      if (dist < bestD) { bestD = dist; best = i }
    })
    setHover(best)
  }

  const hovered = hover != null ? data[hover] : null
  const last = data[data.length - 1]

  return (
    <div ref={wrap} className="relative w-full">
      {geom && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={label}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* Hairline, solid, one step off the surface. Dashing would read as a
              projection or a threshold when it is only a grid. */}
          {ticks.map(v => (
            <g key={v}>
              <line
                x1={geom.x0} x2={geom.x1} y1={geom.py(v)} y2={geom.py(v)}
                stroke="var(--color-border)" strokeWidth={1}
              />
              <text
                x={geom.x0 - 8} y={geom.py(v) + 4} textAnchor="end"
                fill="var(--color-text-tertiary)"
                style={{ fontSize: 'var(--kb-text-micro)', fontVariantNumeric: 'tabular-nums' }}
              >
                {formatBytes(v)}
              </text>
            </g>
          ))}

          <path d={area} fill="var(--color-primary)" fillOpacity={0.1} />
          <polyline
            points={points}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Only the endpoint is marked. A dot on every sample would be a
              number on every point by another name. */}
          <circle
            cx={geom.px(last)} cy={geom.py(last.value)} r={4}
            fill="var(--color-primary)"
            stroke="var(--color-surface-0)" strokeWidth={2}
          />

          {hovered && (
            <>
              <line
                x1={geom.px(hovered)} x2={geom.px(hovered)}
                y1={geom.y0} y2={geom.y1}
                stroke="var(--color-border-strong)" strokeWidth={1}
              />
              <circle
                cx={geom.px(hovered)} cy={geom.py(hovered.value)} r={4}
                fill="var(--color-primary)"
                stroke="var(--color-surface-0)" strokeWidth={2}
              />
            </>
          )}

          <line
            x1={geom.x0} x2={geom.x1} y1={geom.y1} y2={geom.y1}
            stroke="var(--color-border-strong)" strokeWidth={1}
          />
        </svg>
      )}

      {hovered && geom && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-surface-0 px-2.5 py-1.5 shadow-md"
          style={{
            left:      Math.min(Math.max(geom.px(hovered), 70), Math.max(width - 70, 70)),
            top:       geom.py(hovered.value),
            transform: 'translate(-50%, calc(-100% - 10px))',
            fontSize:  'var(--kb-text-meta)',
          }}
        >
          <div className="text-text-tertiary">{hovered.day}</div>
          <div className="tabular-nums text-text-primary">{formatBytes(hovered.value)}</div>
        </div>
      )}
    </div>
  )
}

/** A figure and its caption, side by side, for the row under a chart. */
export function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {label}
      </div>
      <div className="mt-0.5 truncate text-text-primary" style={{ fontSize: 'var(--kb-text-heading)' }}>
        {children}
      </div>
    </div>
  )
}
