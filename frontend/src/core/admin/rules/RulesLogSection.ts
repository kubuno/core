/**
 * Code-behind of `RulesLogSection.kbview` (converted from `RulesLogSection.tsx` by @kubuno/views-migrate).
 */
import ExecutionsPanel from "./ExecutionsPanel"

import { ViewBase } from './RulesLogSection.kbview'

export class RulesLogSection extends ViewBase {
  /** `<ExecutionsPanel>`, rendered by a ReactHost. */
  get ExecutionsPanel() {
    return ExecutionsPanel
  }

  get executions_panel_props() {
    return this.memo('executions_panel_props', [this.props], () => ({ ruleId: this.props.params.get('rule') }))
  }

}

export default RulesLogSection.component()
