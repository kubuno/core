import type { AdminSectionProps } from "./registry";
import { ViewBase } from './UsersSection.kbview';
export type { AdminSectionProps };
export declare class UsersSection extends ViewBase {
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get userId(): string | null;
    get show_case_1(): boolean;
    /** `<UserDetailSection>`, rendered by a ReactHost. */
    get UserDetailSection(): import("react").FunctionComponent<Readonly<import("./user-detail/UserDetailSection").UserDetailSectionProps>>;
    get user_detail_section_props(): {
        userId: string;
        params: URLSearchParams;
        navigate: import("react-router").NavigateFunction;
    };
    get show_main(): boolean;
    /** `<UsersPanel>`, rendered by a ReactHost. */
    get UsersPanel(): import("react").FunctionComponent<Readonly<{}>>;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type UsersSectionStores = ReturnType<UsersSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
