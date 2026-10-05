import { bind, type ElementHandle, type ItemActivateEventArgs } from '@kubuno/views'

import { ViewBase } from './DataTable.kbview'

interface Person { Name: string; Role: string; Projects: number }

const NONE: Person[] = []

const PEOPLE: Person[] = [
  { Name: 'Camille Martin', Role: 'Administratrice', Projects: 12 },
  { Name: 'Yasmine Haddad', Role: 'Développeuse', Projects: 7 },
  { Name: 'Lucas Bernard', Role: 'Designer', Projects: 4 },
  { Name: 'Noah Petit', Role: 'Support', Projects: 2 },
]

/** Gallery page: DataTable (the WV-5b alignment with the desktop's). */
export class DataTable extends ViewBase {
  @bind accessor person = 1
  @bind accessor opened = ''

  get people() {
    return PEOPLE
  }

  // A getter read by a binding returns the same value until it changes (a new [] each time would never settle).
  get none(): Person[] {
    return NONE
  }

  get personText(): string {
    return `SelectedIndex = ${this.person}${this.opened ? ` · activated: ${this.opened}` : ''}`
  }

  row_activated(_sender: ElementHandle, e: ItemActivateEventArgs<Person>): void {
    this.opened = e.item?.Name ?? ''
  }
}

export default DataTable.component()
