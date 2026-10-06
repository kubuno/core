import { bind } from '@kubuno/views'

import { ViewBase } from './RadioGroup.kbview'

/** Gallery page: RadioGroup (both groups share one bound value). */
export class RadioGroup extends ViewBase {
  @bind accessor size = 'comfortable'

  readonly sizes = [
    { id: 'compact', name: 'Compact' },
    { id: 'comfortable', name: 'Comfortable' },
    { id: 'spacious', name: 'Spacious' },
  ]

  get chosen(): string {
    return `SelectedValue: ${this.size}`
  }
}

export default RadioGroup.component()
