import { bind, type Button, type MouseEventArgs } from '@kubuno/views'
import { ViewBase } from './Good.kbview'

export class Good extends ViewBase {
  @bind accessor title = 'Save'
  @bind accessor count = 3
  @bind accessor prefs = { spell: true }

  get canSave(): boolean {
    return this.count > 0
  }

  loaded(): void {}

  save_click(sender: Button, _e: MouseEventArgs): void {
    sender.text = 'Saved'
    this.save.enabled = false
  }
}

export default Good.component()
