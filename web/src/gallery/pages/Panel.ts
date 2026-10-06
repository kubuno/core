import { bind, type ElementHandle, type MouseEventArgs } from '@kubuno/views'

import { ViewBase } from './Panel.kbview'

/** Gallery page: Panel. */
export class Panel extends ViewBase {
  @bind accessor count = 0

  get clicks(): string {
    return `Row clicks: ${this.count}`
  }

  row_click(_sender: ElementHandle, _e: MouseEventArgs): void {
    this.count = this.count + 1
  }
}

export default Panel.component()
