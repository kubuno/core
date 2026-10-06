import { bind, type ItemEventArgs } from '@kubuno/views'

import { ViewBase } from './StatusBar.kbview'

/** Gallery page: StatusBar. */
export class StatusBar extends ViewBase {
  @bind accessor last = 'No cell clicked'
  readonly words = '1 204 words'

  cell_clicked(_sender: unknown, e: ItemEventArgs): void {
    this.last = `Cell #${e.index} clicked`
  }
}

export default StatusBar.component()
