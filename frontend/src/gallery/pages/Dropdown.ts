import { bind } from '@kubuno/views'

import { ViewBase } from './Dropdown.kbview'

/** Gallery page: Dropdown (both lists share one bound value). */
export class Dropdown extends ViewBase {
  @bind accessor sort = 'modified'

  readonly sorts = [
    { key: 'name', text: 'Name' },
    { key: 'modified', text: 'Last modified' },
    { key: 'size', text: 'Size' },
  ]

  get status(): string {
    return `SelectedValue: ${this.sort}`
  }
}

export default Dropdown.component()
