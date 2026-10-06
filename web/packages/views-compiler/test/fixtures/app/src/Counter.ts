import { bind, type Button, type MouseEventArgs } from '@kubuno/views'
import { ViewBase } from './Counter.kbview'

/** The HMR fixture: a counter whose state must survive view and code-behind edits. */
export class Counter extends ViewBase {
  @bind accessor count = 0
  loads = 0

  get label(): string {
    return 'Clicks'
  }

  loaded(): void {
    this.loads++
  }

  inc_click(_sender: Button, _e: MouseEventArgs): void {
    this.count = this.count + 1
  }
}

export default Counter.component()
