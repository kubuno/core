import { bind, type LinkLabel as LinkLabelHandle, type MouseEventArgs } from '@kubuno/views'

import { ViewBase } from './LinkLabel.kbview'

/** Gallery page: LinkLabel (a plain click stays in the page and counts). */
export class LinkLabel extends ViewBase {
  @bind accessor count = 0

  get clicks(): string {
    return `Clicks: ${this.count}`
  }

  link_click(_sender: LinkLabelHandle, _e: MouseEventArgs): void {
    this.count = this.count + 1
  }
}

export default LinkLabel.component()
