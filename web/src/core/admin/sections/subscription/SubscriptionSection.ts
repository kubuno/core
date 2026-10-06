/**
 * Code-behind of `SubscriptionSection.kbview` (converted from `SubscriptionSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views'
import { useTranslation } from "react-i18next"
import { PRIV } from "../../../authz/types"
import { usePrivileges } from "../../../authz/usePrivileges"
import InstanceCard from "./InstanceCard"
import LicenceCard from "./LicenceCard"
import ModulesLicenceCard from "./ModulesLicenceCard"
import SupportCard from "./SupportCard"
import { useSubscription } from "./api"

import { ViewBase } from './SubscriptionSection.kbview'

export class SubscriptionSection extends ViewBase {
  can!: SubscriptionSectionStores['can']
  data!: SubscriptionSectionStores['data']
  isLoading!: boolean
  isError!: boolean
  refetch!: SubscriptionSectionStores['refetch']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { can } = usePrivileges()
    const { data, isLoading, isError, refetch } = useSubscription()
    return { t, can, data, isLoading, isError, refetch }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ can: s.can, data: s.data, isLoading: s.isLoading, isError: s.isError, refetch: s.refetch })
  }

  get canManage(): boolean {
    return this.can(PRIV.SETTINGS_MANAGE)
  }

  get show_case_1() {
    return !!(this.isLoading)
  }

  get show_case_2() {
    return !(this.isLoading) && !!(this.isError || !this.data)
  }

  get show_main() {
    return !(this.isLoading) && !(this.isError || !this.data)
  }

  /** `<LicenceCard>`, rendered by a ReactHost. */
  get LicenceCard() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    return LicenceCard
  }

  get licence_card_props() {
    return this.memo('licence_card_props', [this.data, this.isLoading, this.isError], () => {
      if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
      return ({ licence: this.data.licence })
    })
  }

  /** `<InstanceCard>`, rendered by a ReactHost. */
  get InstanceCard() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    return InstanceCard
  }

  get instance_card_props() {
    return this.memo('instance_card_props', [this.data, this.isLoading, this.isError], () => {
      if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
      return ({ instance: this.data.instance, accounts: this.data.accounts })
    })
  }

  /** `<SupportCard>`, rendered by a ReactHost. */
  get SupportCard() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    return SupportCard
  }

  get support_card_props() {
    return this.memo('support_card_props', [this.data, this.canManage, this.isLoading, this.isError], () => {
      if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
      return ({ support: this.data.support, canManage: this.canManage })
    })
  }

  get show_data_modules_data() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data))) return undefined as never
    return !!(this.data.modules && this.data.modules.length > 0)
  }

  /** `<ModulesLicenceCard>`, rendered by a ReactHost. */
  get ModulesLicenceCard() {
    if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.data.modules && this.data.modules.length > 0)) return undefined as never
    return ModulesLicenceCard
  }

  get modules_licence_card_props() {
    return this.memo('modules_licence_card_props', [this.data, this.isLoading, this.isError], () => {
      if (!(!(this.isLoading)) || !(!(this.isError || !this.data)) || !(this.data.modules && this.data.modules.length > 0)) return undefined as never
      return ({ modules: this.data.modules })
    })
  }

  empty_state_action(_sender: unknown, _args: EventArgs) {
    if (!(!(this.isLoading)) || !(this.isError || !this.data)) return undefined as never
    void this.refetch()
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type SubscriptionSectionStores = ReturnType<SubscriptionSection['useStores']>

export default SubscriptionSection.component()
