/**
 * Code-behind of `ProfileTab.kbview` (converted from `ProfileTab.tsx` by @kubuno/views-migrate).
 */
import type { User } from "../../../types"
import IdentityCard from "./cards/IdentityCard"
import OrganisationCard from "./cards/OrganisationCard"
import PersonalCard from "./cards/PersonalCard"
import StorageCard from "./cards/StorageCard"
import LifecycleCard from "./cards/LifecycleCard"

import { ViewBase } from './ProfileTab.kbview'

export type ProfileTabProps = { user: User }

export class ProfileTab extends ViewBase {
  /** `<IdentityCard>`, rendered by a ReactHost. */
  get IdentityCard() {
    return IdentityCard
  }

  get identity_card_props() {
    return this.memo('identity_card_props', [this.props], () => ({ user: this.props.user }))
  }

  /** `<OrganisationCard>`, rendered by a ReactHost. */
  get OrganisationCard() {
    return OrganisationCard
  }

  /** `<PersonalCard>`, rendered by a ReactHost. */
  get PersonalCard() {
    return PersonalCard
  }

  /** `<StorageCard>`, rendered by a ReactHost. */
  get StorageCard() {
    return StorageCard
  }

  /** `<LifecycleCard>`, rendered by a ReactHost. */
  get LifecycleCard() {
    return LifecycleCard
  }

}

export default ProfileTab.component()
