import { bind } from '@kubuno/views'
import { ViewBase } from './Bad.kbview'

// Deliberately wrong: every binding of Bad.kbview has a type error, and save_click is missing.
export class Bad extends ViewBase {
  @bind accessor name = 'n'
  prefs = { font: 'sans' }

  get total(): boolean {
    return true
  }

  loaded(): void {}
}

export default Bad.component()
