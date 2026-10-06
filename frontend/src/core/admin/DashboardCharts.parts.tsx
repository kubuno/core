/**
 * The parts of `DashboardCharts.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { DashboardCharts } from './DashboardCharts'

export function Part1({ left, top, children }: { left: NonNullable<DashboardCharts['props']['left']>; top: NonNullable<DashboardCharts['props']['top']>; children: DashboardCharts['props']['children'] }) {
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
