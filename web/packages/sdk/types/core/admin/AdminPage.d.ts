import { Navigate } from "react-router-dom";
import { Slot } from "../slots/SlotRegistry";
import AdminBreadcrumb from "./AdminBreadcrumb";
import { ViewBase } from './AdminPage.kbview';
import * as __parts from './AdminPage.parts';
export declare class AdminPage extends ViewBase {
    tr: AdminPageStores['t'];
    can: AdminPageStores['can'];
    isAdmin: boolean;
    isLoading: boolean;
    navigate: AdminPageStores['navigate'];
    pathname: string;
    params: URLSearchParams;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../authz/types").CanFn;
        isAdmin: boolean;
        isLoading: boolean;
        navigate: import("react-router").NavigateFunction;
        pathname: string;
        params: URLSearchParams;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get tab(): string;
    get legacy(): string | null;
    get forSection(): URLSearchParams;
    get meta(): import("./adminNav").NavMeta | undefined;
    get titleKey(): string | undefined;
    get section(): import("./sections/registry").AdminSection;
    get Section(): import("react").ComponentType<import("./ModulesPanel").AdminSectionProps>;
    get show_case_1(): boolean;
    /** `<Navigate>`, rendered by a ReactHost. */
    get Navigate(): typeof Navigate;
    get navigate_props(): {
        to: string;
        replace: boolean;
    };
    get show_case_2(): boolean;
    get show_case_3(): boolean;
    /** `<Navigate>`, rendered by a ReactHost. */
    get Navigate2(): typeof Navigate;
    get navigate_props2(): {
        to: string;
        replace: boolean;
    };
    get show_case_4(): boolean;
    /** `<AdminSectionNotFound>`, rendered by a ReactHost. */
    get AdminSectionNotFound(): import("react").FunctionComponent<Readonly<import("./AdminSectionNotFound").AdminSectionNotFoundProps>>;
    get admin_section_not_found_props(): {
        tab: string;
    };
    get show_case_5(): boolean;
    /** `<AdminForbidden>`, rendered by a ReactHost. */
    get AdminForbidden(): import("react").FunctionComponent<Readonly<import("./AdminForbidden").AdminForbiddenProps>>;
    get admin_forbidden_props(): {
        titleKey: string | undefined;
    };
    get show_main(): boolean;
    /** `<AdminBreadcrumb>`, rendered by a ReactHost. */
    get AdminBreadcrumb(): typeof AdminBreadcrumb;
    get admin_breadcrumb_props(): {
        tab: string;
    };
    get show_section_own_header(): boolean;
    get h1_text(): string;
    get part1_props(): {
        tab: string;
        Section: import("react").ComponentType<import("./ModulesPanel").AdminSectionProps>;
        forSection: URLSearchParams;
        navigate: import("react-router").NavigateFunction;
    };
    /** A part of the screen still written in React (<AdminSectionBoundary> is no .kbview element (./AdminSectionBoundary#default)). */
    get Part1(): typeof __parts.Part1;
    get show_meta_item_soon(): boolean;
    /** `<ComingSoon>`, rendered by a ReactHost. */
    get ComingSoon(): import("react").FunctionComponent<Readonly<import("./sections/ComingSoon").ComingSoonProps>>;
    get coming_soon_props(): {
        titleKey: string;
    };
    /** `<Slot>`, rendered by a ReactHost. */
    get Slot(): typeof Slot;
    get slot_props(): {
        name: string;
    };
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AdminPageStores = ReturnType<AdminPage['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
