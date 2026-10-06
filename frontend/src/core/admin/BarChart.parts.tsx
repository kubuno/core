/**
 * The parts of `BarChart.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import Tip from "./DashboardCharts"
import type { BarChart } from './BarChart'

export function Part1({ wrap, height, canvas, onMove, setHi, tip, data, hi, unit }: { wrap: NonNullable<BarChart['wrap']>; height: NonNullable<BarChart['height']>; canvas: NonNullable<BarChart['canvas']>; onMove: BarChart['onMove']; setHi: NonNullable<BarChart['setHi']>; tip: NonNullable<BarChart['tip']>; data: NonNullable<BarChart['props']['data']>; hi: BarChart['hi']; unit: NonNullable<BarChart['props']['unit']> }) {
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
