import { bind, type ElementHandle, type ValueChangedEventArgs } from '@kubuno/views'

import { ViewBase } from './Stepper.kbview'

/** Gallery page: Stepper (CurrentIndex follows OnStepSelected). */
export class Stepper extends ViewBase {
  @bind accessor step = 1

  get status(): string {
    return `CurrentIndex: ${this.step}`
  }

  step_selected(_sender: ElementHandle, e: ValueChangedEventArgs<number>): void {
    this.step = Number(e.value)
  }
}

export default Stepper.component()
