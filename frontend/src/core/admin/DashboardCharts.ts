/**
 * Code-behind of `DashboardCharts.kbview` (converted from `DashboardCharts.tsx` by @kubuno/views-migrate).
 */
import { useState, useEffect, type ReactNode } from "react"
import { useUiTheme } from "../hooks/useUiTheme"

import { ViewBase } from './DashboardCharts.kbview'
import * as __parts from './DashboardCharts.parts'

export const CHART_COLORS = ['#1a73e8', '#1e8e3e', '#f9ab00', '#d93025', '#9c27b0', '#0b8043', '#e8710a', '#12b5cb']

export const CHART_SERIES_LIGHT = [
  'var(--kb-chart-1)', 'var(--kb-chart-2)', 'var(--kb-chart-3)', 'var(--kb-chart-4)',
  'var(--kb-chart-5)', 'var(--kb-chart-6)', 'var(--kb-chart-7)', 'var(--kb-chart-8)',
] as const

export const CHART_SERIES_DARK = [
  'var(--kb-chart-1-dark)', 'var(--kb-chart-2-dark)', 'var(--kb-chart-3-dark)', 'var(--kb-chart-4-dark)',
  'var(--kb-chart-5-dark)', 'var(--kb-chart-6-dark)', 'var(--kb-chart-7-dark)', 'var(--kb-chart-8-dark)',
] as const

export function useChartSeries(): readonly string[] {
  return useUiTheme() === 'dark' ? CHART_SERIES_DARK : CHART_SERIES_LIGHT
}

const FALLBACK_INK = '#5f6368'

function cssVar(el: Element | null, name: string, fallback: string): string {
  if (!el) return fallback
  const v = getComputedStyle(el).getPropertyValue(name).trim()
  return v || fallback
}

export function resolveColor(el: Element | null, color: string): string {
  const m = /^var\(\s*(--[\w-]+)\s*\)$/.exec(color)
  return m ? cssVar(el, m[1], FALLBACK_INK) : color
}

export function chartInk(el: Element | null) {
  return {
    grid:    cssVar(el, '--color-border', '#eceef1'),
    label:   cssVar(el, '--color-text-tertiary', FALLBACK_INK),
    surface: cssVar(el, '--color-surface-0', '#ffffff'),
  }
}

export function fmtBytes(n: number): string {
  if (!n || n < 0) return '0 o'
  const u = ['o', 'Ko', 'Mo', 'Go', 'To', 'Po']
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
  const v = n / Math.pow(1024, i)
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${u[i]}`
}

function niceCeil(v: number): number {
  if (v <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / pow
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow
}

export function axisTicks(max: number): { top: number; ticks: number[] } {
  const nm = niceCeil(Math.max(1, max))
  const step = nm <= 5 ? 1 : niceCeil(nm / 4)
  const ticks: number[] = []
  for (let v = 0; v <= nm + 1e-9; v += step) ticks.push(Math.round(v))
  const uniq = [...new Set(ticks)]
  return { top: uniq[uniq.length - 1], ticks: uniq }
}

export function useWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
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

export const PAD = { l: 38, r: 8, t: 10, b: 20 }

export type TipProps = { left: number; top: number; children: ReactNode }

export class DashboardCharts extends ViewBase {
  get part1_props() {
    return this.memo('part1_props', [this.props], () => ({ left: this.props.left, top: this.props.top, children: this.props.children }))
  }

  /** A part of the screen still written in React (<div> with a computed style). */
  get Part1() {
    return __parts.Part1
  }

}

export default DashboardCharts.component()
