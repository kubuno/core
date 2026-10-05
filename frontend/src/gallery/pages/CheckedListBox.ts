import { bind, type ElementHandle, type ItemCheckEventArgs } from '@kubuno/views'

import { ViewBase } from './CheckedListBox.kbview'

const MODULES = [
  { Text: 'Drive', Checked: true }, { Text: 'Mail', Checked: true }, { Text: 'Agenda' }, { Text: 'Photos' }, { Text: 'Notes', Checked: true },
]

/** Gallery page: CheckedListBox. */
export class CheckedListBox extends ViewBase {
  @bind accessor mail = false
  @bind accessor last = ''

  get modules() {
    return MODULES
  }

  get status(): string {
    return `Courriels: ${this.mail ? 'oui' : 'non'}${this.last ? ` · ${this.last}` : ''}`
  }

  checked_changed(_sender: ElementHandle, e: ItemCheckEventArgs): void {
    this.last = `item ${e.index} ${e.checked ? 'checked' : 'unchecked'}`
  }
}

export default CheckedListBox.component()
