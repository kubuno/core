import { bind, type ValueChangedEventArgs } from '@kubuno/views'

import { ViewBase } from './SearchField.kbview'

/** Gallery page: SearchField. */
export class SearchField extends ViewBase {
  @bind accessor query = ''
  @bind accessor searched = ''

  get status(): string {
    return `Text: "${this.query}" · searched: "${this.searched}"`
  }

  search_submitted(_sender: unknown, e: ValueChangedEventArgs<string>): void {
    this.searched = e.value
  }
}

export default SearchField.component()
