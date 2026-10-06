import { ViewBase } from './AdminRolesPanel.kbview';
export declare class AdminRolesPanel extends ViewBase {
    accessor creating: boolean;
    tr: AdminRolesPanelStores['t'];
    params: URLSearchParams;
    can: AdminRolesPanelStores['can'];
    isSuperuser: boolean;
    roles: AdminRolesPanelHooks['roles'];
    catalogue: AdminRolesPanelHooks['catalogue'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        params: URLSearchParams;
        can: import("../authz/types").CanFn;
        isSuperuser: boolean;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        roles: import("@tanstack/react-query").UseQueryResult<NoInfer<import("../authz/types").Role[]>, Error>;
        catalogue: import("@tanstack/react-query").UseQueryResult<NoInfer<import("../authz/types").Privilege[]>, Error>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get mayRead(): boolean;
    get list(): NoInfer<import("../authz/types").Role[]>;
    get selected(): import("../authz/types").Role | undefined;
    get editor(): false | import("react").JSX.Element;
    get show_case_1(): boolean;
    /** `<AdminForbidden>`, rendered by a ReactHost. */
    get AdminForbidden(): import("react").FunctionComponent<Readonly<import("./AdminForbidden").AdminForbiddenProps>>;
    get admin_forbidden_props(): {
        titleKey: string;
    };
    get show_case_2(): boolean;
    /** `<RoleDetail>`, rendered by a ReactHost. */
    get RoleDetail(): import("react").FunctionComponent<Readonly<import("./roles/RoleDetail").RoleDetailProps>>;
    get role_detail_props(): {
        role: import("../authz/types").Role;
        catalogue: NoInfer<import("../authz/types").Privilege[]>;
    };
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_editor(): {
        children: false | import("react").JSX.Element;
    };
    get show_main(): boolean;
    /** `<RolesList>`, rendered by a ReactHost. */
    get RolesList(): import("react").FunctionComponent<Readonly<import("./roles/RolesList").RolesListProps>>;
    get roles_list_props(): Readonly<import("./roles/RolesList").RolesListProps>;
    get content_editor2(): {
        children: false | import("react").JSX.Element;
    };
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AdminRolesPanelStores = ReturnType<AdminRolesPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AdminRolesPanelHooks = ReturnType<AdminRolesPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
