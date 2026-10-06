/**
 * Code-behind of `ProfileTab.kbview` (converted from `ProfileTab.tsx` by @kubuno/views-migrate).
 */
import type { User } from "../../../types";
import IdentityCard from "./cards/IdentityCard";
import OrganisationCard from "./cards/OrganisationCard";
import PersonalCard from "./cards/PersonalCard";
import StorageCard from "./cards/StorageCard";
import { ViewBase } from './ProfileTab.kbview';
export type ProfileTabProps = {
    user: User;
};
export declare class ProfileTab extends ViewBase {
    /** `<IdentityCard>`, rendered by a ReactHost. */
    get IdentityCard(): typeof IdentityCard;
    get identity_card_props(): {
        user: User;
    };
    /** `<OrganisationCard>`, rendered by a ReactHost. */
    get OrganisationCard(): typeof OrganisationCard;
    /** `<PersonalCard>`, rendered by a ReactHost. */
    get PersonalCard(): typeof PersonalCard;
    /** `<StorageCard>`, rendered by a ReactHost. */
    get StorageCard(): typeof StorageCard;
    /** `<LifecycleCard>`, rendered by a ReactHost. */
    get LifecycleCard(): import("react").FunctionComponent<Readonly<import("./cards/LifecycleCard").LifecycleCardProps>>;
}
declare const _default: import("react").FunctionComponent<Readonly<ProfileTabProps>>;
export default _default;
