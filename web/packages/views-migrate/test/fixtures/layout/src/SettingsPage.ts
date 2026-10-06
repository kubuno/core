import { ViewBase } from './SettingsPage.kbview'
import { helper } from './feature/Thing'

export class SettingsPage extends ViewBase {
  readonly h = helper
}

export default SettingsPage.component()
