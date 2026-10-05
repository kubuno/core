import { bind } from '@kubuno/views'

import { ViewBase } from './MaskedField.kbview'

/** Gallery page: MaskedField. */
export class MaskedField extends ViewBase {
  @bind accessor date = '05/10/2026'

  get status(): string {
    return `Date: "${this.date}"`
  }
}

export default MaskedField.component()
