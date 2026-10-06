/**
 * The parts of `TrendChart.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { formatBytes } from "../sections/format"
import type { TrendChart } from './TrendChart'

export function Part1({ wrap, geom, width, height, label, onMove, setHover, ticks, area, points, last, hovered }: { wrap: NonNullable<TrendChart['wrap']>; geom: NonNullable<TrendChart['geom']>; width: NonNullable<TrendChart['width']>; height: NonNullable<TrendChart['height']>; label: NonNullable<TrendChart['props']['label']>; onMove: TrendChart['onMove']; setHover: NonNullable<TrendChart['setHover']>; ticks: NonNullable<TrendChart['ticks']>; area: NonNullable<TrendChart['area']>; points: NonNullable<TrendChart['points']>; last: NonNullable<TrendChart['last']>; hovered: NonNullable<TrendChart['hovered']> }) {
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
