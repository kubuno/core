import { bind, type ItemEventArgs } from '@kubuno/views'

import { ViewBase } from './Toolbar.kbview'

/** Gallery page: Toolbar. */
export class Toolbar extends ViewBase {
  @bind accessor last = 'No command yet'

  item_click(_sender: unknown, e: ItemEventArgs): void {
    this.last = `Command #${e.index}`
  }
}

export default Toolbar.component()
