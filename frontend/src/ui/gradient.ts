// Portable gradient model shared across the app via @ui, plus a CSS serializer.
// Used by the GradientPicker primitive and by every module that offers gradient
// fills (PaintSharp/Apex, Office documents/spreadsheets/presentations…).
import { hexToRgb } from './color'

export interface GradientStop {
  color:    string   // "#rrggbb"
  position: number   // 0..1
  opacity:  number   // 0..100
}

export interface Gradient {
  type:  'linear' | 'radial'
  angle: number          // degrees (linear only; 0 = →, 90 = ↓ in CSS)
  stops: GradientStop[]  // at least 2
}

export function rgbaFromHex(hex: string, opacity = 100): string {
  const [r, g, b] = hexToRgb(hex)
  const a = Math.max(0, Math.min(100, opacity)) / 100
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// Serialize to a CSS `background` value. Stops are sorted by position.
export function gradientToCss(g: Gradient): string {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map(s => `${rgbaFromHex(s.color, s.opacity ?? 100)} ${Math.round(s.position * 100)}%`)
    .join(', ')
  return g.type === 'radial'
    ? `radial-gradient(circle, ${stops})`
    : `linear-gradient(${Math.round(g.angle)}deg, ${stops})`
}

export const DEFAULT_GRADIENT: Gradient = {
  type: 'linear',
  angle: 90,
  stops: [
    { color: '#4a90d9', position: 0, opacity: 100 },
    { color: '#9b59b6', position: 1, opacity: 100 },
  ],
}
