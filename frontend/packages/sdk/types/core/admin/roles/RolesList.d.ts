import ConfirmDialog from "@ui/ConfirmDialog";
import { type Privilege, type Role } from "../../authz/types";
import { ViewBase } from './RolesList.kbview';
import * as __parts from './RolesList.parts';
export type RolesListProps = {
    roles: Role[];
    catalogue: Privilege[];
    loading: boolean;
    error?: string;
    onRetry?: () => void;
};
export declare class RolesList extends ViewBase {
    accessor q: string;
    accessor assign: Role | null;
    accessor creating: boolean;
    tr: RolesListStores['t'];
    toast: RolesListStores['toast'];
    navigate: RolesListStores['navigate'];
    can: RolesListStores['can'];
    isSuperuser: boolean;
    roleName: (role: Role) => string;
    roleDescription: (role: Role) => string | null;
    confirm: RolesListStores['confirm'];
    confirmState: RolesListStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    remove: RolesListStores['remove'];
    rows: Role[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toast: import("@ui").ToastApi;
        navigate: import("react-router").NavigateFunction;
        can: import("../../authz/types").CanFn;
        isSuperuser: boolean;
        roleName: (role: Role) => string;
        roleDescription: (role: Role) => string | null;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        remove: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        rows: Role[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canGrant(): boolean;
    get show_can_grant(): boolean;
    get part1_props(): {
        rows: Role[];
        loading: boolean;
        error: string | undefined;
        onRetry: (() => void) | undefined;
        q: string;
        setQ: (value: RolesList["q"] | ((prev: RolesList["q"]) => RolesList["q"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
        isSuperuser: boolean;
        setCreating: (value: RolesList["creating"] | ((prev: RolesList["creating"]) => RolesList["creating"])) => void;
        roleName: (role: Role) => string;
        roleDescription: (role: Role) => string | null;
        canGrant: boolean;
        setAssign: (value: Role | null | ((prev: Role | null) => Role | null)) => void;
        openRole: (role: Role) => void | Promise<void>;
        askDelete: (role: Role) => Promise<void>;
    };
    /** A part of the screen still written in React (<DataTable> rowKey, onRetry, filtered, onClearFilters, toolbar, emptyState, columns, rowActions, t: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_assign(): boolean;
    /** `<AssignRoleDialog>`, rendered by a ReactHost. */
    get AssignRoleDialog(): import("react").FunctionComponent<Readonly<import("./AssignRoleDialog").AssignRoleDialogProps>>;
    get assign_role_dialog_props(): Readonly<import("./AssignRoleDialog").AssignRoleDialogProps>;
    /** `<RoleCreateDialog>`, rendered by a ReactHost. */
    get RoleCreateDialog(): import("react").FunctionComponent<Readonly<import("./RoleCreateDialog").RoleCreateDialogProps>>;
    get role_create_dialog_props(): Readonly<import("./RoleCreateDialog").RoleCreateDialogProps>;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof ConfirmDialog;
    get confirm_dialog_props(): {
        onConfirm: () => void;
        onCancel: () => void;
        resolve: (ok: boolean) => void;
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: import("@ui").ConfirmVariant;
        hideCancel?: boolean;
    };
    openRole(role: Role): void | Promise<void>;
    askDelete(role: Role): Promise<void>;
    /** `setQ` of the TSX: a value, or an update of the previous one. */
    setQ(value: RolesList['q'] | ((prev: RolesList['q']) => RolesList['q'])): void;
    /** `setCreating` of the TSX: a value, or an update of the previous one. */
    setCreating(value: RolesList['creating'] | ((prev: RolesList['creating']) => RolesList['creating'])): void;
    /** `setAssign` of the TSX: a value, or an update of the previous one. */
    setAssign(value: Role | null | ((prev: Role | null) => Role | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RolesListStores = ReturnType<RolesList['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type RolesListHooks = ReturnType<RolesList['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<RolesListProps>>;
export default _default;
