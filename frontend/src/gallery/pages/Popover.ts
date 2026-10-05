import { bind } from '@kubuno/views'

import { ViewBase } from './Popover.kbview'

/** Gallery page: Popover. */
export class Popover extends ViewBase {
  @bind accessor open = false
  @bind accessor rightOpen = false
  @bind accessor events = 'closed'

  get status(): string {
    return `Popover: ${this.events}`
  }

  opener_click(): void {
    this.open = !this.open
  }

  right_click(): void {
    this.rightOpen = !this.rightOpen
  }

  opened(): void {
    this.events = 'opened'
  }

  closed(): void {
    this.events = 'closed'
  }
}

export default Popover.component()
