/**
 * Code-behind of `RoleIcon.kbview` (converted from `RoleIcon.tsx` by @kubuno/views-migrate).
 */
import { type Role } from "../../authz/types"

import { ViewBase } from './RoleIcon.kbview'

export type RoleIconProps = { role: Role; size?: number }

export class RoleIcon extends ViewBase {
  get size() {
    return this.props.size ?? 16
  }

  get show_case_1() {
    return !!(this.props.role.is_superuser)
  }

  get show_case_2() {
    return !(this.props.role.is_superuser) && !!(this.props.role.is_system)
  }

  get show_main() {
    return !(this.props.role.is_superuser) && !(this.props.role.is_system)
  }

}

export default RoleIcon.component()
