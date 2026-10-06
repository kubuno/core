/**
 * The parts of `ReportSeriesChart.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { ReportSeriesChart } from './ReportSeriesChart'

export function Part1({ W, H, gid, color, ticks, x0, x1, yOf, unit, shape, n, plotW, data, y1, top, plotH, every }: { W: NonNullable<ReportSeriesChart['W']>; H: NonNullable<ReportSeriesChart['H']>; gid: NonNullable<ReportSeriesChart['gid']>; color: NonNullable<ReportSeriesChart['color']>; ticks: NonNullable<ReportSeriesChart['ticks']>; x0: NonNullable<ReportSeriesChart['x0']>; x1: NonNullable<ReportSeriesChart['x1']>; yOf: ReportSeriesChart['yOf']; unit: NonNullable<ReportSeriesChart['props']['unit']>; shape: NonNullable<ReportSeriesChart['shape']>; n: NonNullable<ReportSeriesChart['n']>; plotW: NonNullable<ReportSeriesChart['plotW']>; data: NonNullable<ReportSeriesChart['props']['data']>; y1: NonNullable<ReportSeriesChart['y1']>; top: NonNullable<ReportSeriesChart['top']>; plotH: NonNullable<ReportSeriesChart['plotH']>; every: NonNullable<ReportSeriesChart['every']> }) {
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
