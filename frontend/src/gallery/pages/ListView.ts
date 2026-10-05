import { bind, type ElementHandle, type ItemActivateEventArgs } from '@kubuno/views'

import { ViewBase } from './ListView.kbview'

interface FileRow { Name: string; Size: string; Date: string }

const FILES: FileRow[] = Array.from({ length: 2_000 }, (_, k) => ({
  Name: `Document ${String(k + 1).padStart(4, '0')}.pdf`,
  Size: `${((k * 37) % 900) + 12} Ko`,
  Date: `2026-0${(k % 9) + 1}-1${k % 10}`,
}))

/** Gallery page: ListView. */
export class ListView extends ViewBase {
  @bind accessor file = 0
  @bind accessor opened = ''

  get files() {
    return FILES
  }

  get fileText(): string {
    return `SelectedIndex = ${this.file}${this.opened ? ` · activated: ${this.opened}` : ''}`
  }

  file_activate(_sender: ElementHandle, e: ItemActivateEventArgs<FileRow>): void {
    this.opened = e.item?.Name ?? ''
  }
}

export default ListView.component()
