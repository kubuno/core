/**
 * Code-behind of `StatusBadge.kbview` (converted from `StatusBadge.tsx` by @kubuno/views-migrate).
 */

import { ViewBase } from './StatusBadge.kbview'

export type StatusBadgeProps = { active: boolean; label: string }

export class StatusBadge extends ViewBase {
  get variant() {
    return this.props.active ? 'success' : 'default'
  }

}

export default StatusBadge.component()
