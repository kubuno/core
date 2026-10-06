import { bind, type ValueChangedEventArgs } from '@kubuno/views'

import { ViewBase } from './Sidebar.kbview'

/** Gallery page: Sidebar. */
export class Sidebar extends ViewBase {
  @bind accessor selected = 'shared'
  @bind accessor invoked = ''

  get status(): string {
    return `Selected: ${this.selected}${this.invoked ? ` · invoked: ${this.invoked}` : ''}`
  }

  readonly rows = [
    { Text: 'Inbox', Icon: 'Inbox', Key: 'inbox' },
    { Text: 'Sent', Icon: 'Send', Key: 'sent' },
    { Text: 'Folders', Kind: 'Section' },
    { Text: 'Invoices', Icon: 'FolderOpen', Key: 'invoices' },
    { Text: '2026', Icon: 'Star', Key: 'y2026', Level: 1 },
  ]

  item_invoked(_sender: unknown, e: ValueChangedEventArgs<string>): void {
    this.invoked = e.value
  }
}

export default Sidebar.component()
