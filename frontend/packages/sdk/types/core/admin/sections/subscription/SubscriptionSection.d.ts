/**
 * Code-behind of `SubscriptionSection.kbview` (converted from `SubscriptionSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { ViewBase } from './SubscriptionSection.kbview';
export declare class SubscriptionSection extends ViewBase {
    can: SubscriptionSectionStores['can'];
    data: SubscriptionSectionStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: SubscriptionSectionStores['refetch'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../../authz/types").CanFn;
        data: NoInfer<import("./api").SubscriptionPayload> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").SubscriptionPayload>, Error>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    /** `<LicenceCard>`, rendered by a ReactHost. */
    get LicenceCard(): import("react").FunctionComponent<Readonly<import("./LicenceCard").LicenceCardProps>>;
    get licence_card_props(): {
        licence: import("./api").LicenceInfo;
    };
    /** `<InstanceCard>`, rendered by a ReactHost. */
    get InstanceCard(): import("react").FunctionComponent<Readonly<import("./InstanceCard").InstanceCardProps>>;
    get instance_card_props(): {
        instance: import("./api").InstanceInfo;
        accounts: import("./api").AccountCounts | null;
    };
    /** `<SupportCard>`, rendered by a ReactHost. */
    get SupportCard(): import("react").FunctionComponent<Readonly<import("./SupportCard").SupportCardProps>>;
    get support_card_props(): {
        support: import("./api").SupportInfo;
        canManage: boolean;
    };
    get show_data_modules_data(): boolean;
    /** `<ModulesLicenceCard>`, rendered by a ReactHost. */
    get ModulesLicenceCard(): import("react").FunctionComponent<Readonly<import("./ModulesLicenceCard").ModulesLicenceCardProps>>;
    get modules_licence_card_props(): {
        modules: import("./api").InstalledModule[];
    };
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SubscriptionSectionStores = ReturnType<SubscriptionSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
