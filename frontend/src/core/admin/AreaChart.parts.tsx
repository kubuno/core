/**
 * The parts of `AreaChart.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import Tip from "./DashboardCharts"
import type { AreaChart } from './AreaChart'

export function Part1({ wrap, height, canvas, onMove, setHi, tip, data, hi, unit }: { wrap: NonNullable<AreaChart['wrap']>; height: NonNullable<AreaChart['height']>; canvas: NonNullable<AreaChart['canvas']>; onMove: AreaChart['onMove']; setHi: NonNullable<AreaChart['setHi']>; tip: NonNullable<AreaChart['tip']>; data: NonNullable<AreaChart['props']['data']>; hi: AreaChart['hi']; unit: NonNullable<AreaChart['props']['unit']> }) {
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
