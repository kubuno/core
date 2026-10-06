import { bind, type PaintEventArgs } from '@kubuno/views'

import { ViewBase } from './PaintBox.kbview'

/** Gallery page: PaintBox. */
export class PaintBox extends ViewBase {
  @bind accessor values: number[] = [3, 7, 4, 9, 6, 2, 8]
  @bind accessor count = 0

  get paints(): string {
    return `Painted ${this.count} time(s)`
  }

  chart_paint(_sender: unknown, e: PaintEventArgs): void {
    const { ctx, width, height } = e
    const data = (e.data as number[] | undefined) ?? []
    const css = getComputedStyle(document.documentElement)
    const bar = css.getPropertyValue('--color-primary').trim() || '#1a73e8'
    const axis = css.getPropertyValue('--color-border').trim() || '#e0e0e0'
    const pad = 16
    const max = Math.max(1, ...data)
    const w = (width - pad * 2) / Math.max(1, data.length)
    ctx.strokeStyle = axis
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad, height - pad + 0.5)
    ctx.lineTo(width - pad, height - pad + 0.5)
    ctx.stroke()
    ctx.fillStyle = bar
    data.forEach((v, k) => {
      const h = ((height - pad * 2) * v) / max
      ctx.beginPath()
      ctx.roundRect(pad + k * w + w * 0.2, height - pad - h, w * 0.6, h, 4)
      ctx.fill()
    })
    queueMicrotask(() => { this.count = this.count + 1 })
  }

  shuffle_click(): void {
    this.values = this.values.map((v, k) => ((v * 7 + k * 3) % 10) + 1)
  }
}

export default PaintBox.component()
