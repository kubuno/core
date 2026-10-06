/**
 * The parts of `Sparkline.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { Sparkline } from './Sparkline'

export function Part1({ width, height, gid, color, line }: { width: NonNullable<Sparkline['width']>; height: NonNullable<Sparkline['height']>; gid: NonNullable<Sparkline['gid']>; color: NonNullable<Sparkline['color']>; line: NonNullable<Sparkline['line']> }) {
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
