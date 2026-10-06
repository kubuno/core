/**
 * Code-behind of `Sparkline.kbview` (converted from `Sparkline.tsx` by @kubuno/views-migrate).
 */
import { useId } from "react"

import { ViewBase } from './Sparkline.kbview'
import * as __parts from './Sparkline.parts'

export type SparklineProps = { data: number[]; color?: string; width?: number; height?: number }

export class Sparkline extends ViewBase {
  gid!: string

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const gid = useId()
    return { gid }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ gid: s.gid })
  }

  get color() {
    return this.props.color ?? '#1a73e8'
  }

  get width() {
    return this.props.width ?? 80
  }

  get height() {
    return this.props.height ?? 28
  }

  get max(): number {
    if (!(!(!this.props.data.length))) return undefined as never
    return Math.max(1, ...this.props.data)
  }

  get pts(): number[][] {
    return this.memo('pts', [this.props, this.width, this.height, this.max], () => {
      if (!(!(!this.props.data.length))) return undefined as never
      return this.props.data.map((v, i) => [(i / Math.max(1, this.props.data.length - 1)) * this.width, this.height - (v / this.max) * (this.height - 3) - 1.5])
    })
  }

  get line(): string {
    if (!(!(!this.props.data.length))) return undefined as never
    return this.pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  }

  get show_case_1() {
    return !!(!this.props.data.length)
  }

  get show_main() {
    return !(!this.props.data.length)
  }

  get part1_props() {
    return this.memo('part1_props', [this.width, this.height, this.gid, this.color, this.line, this.props], () => {
      if (!(!(!this.props.data.length))) return undefined as never
      return ({ width: this.width, height: this.height, gid: this.gid, color: this.color, line: this.line })
    })
  }

  /** A part of the screen still written in React (<svg> has no .kbview element yet). */
  get Part1() {
    if (!(!(!this.props.data.length))) return undefined as never
    return __parts.Part1
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type SparklineStores = ReturnType<Sparkline['useStores']>

export default Sparkline.component()
