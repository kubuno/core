import ConfirmDialog from "@ui/ConfirmDialog";
import { type Privilege, type Role, type RoleAssignment } from "../../authz/types";
import RoleIdentityCard from "./RoleIdentityCard";
import RolePrivilegesCard from "./RolePrivilegesCard";
import { ViewBase } from './RoleDetail.kbview';
import * as __parts from './RoleDetail.parts';
export type RoleDetailProps = {
    role: Role;
    catalogue: Privilege[];
};
export declare class RoleDetail extends ViewBase {
    accessor assignOpen: boolean;
    tr: RoleDetailStores['t'];
    toast: RoleDetailStores['toast'];
    can: RoleDetailStores['can'];
    isSuperuser: boolean;
    roleName: (role: Role) => string;
    confirm: RoleDetailStores['confirm'];
    confirmState: RoleDetailStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    assignments: RoleDetailHooks['assignments'];
    isLoading: boolean;
    revoke: RoleDetailStores['revoke'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toast: import("@ui").ToastApi;
        can: import("../../authz/types").CanFn;
        isSuperuser: boolean;
        roleName: (role: Role) => string;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        revoke: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        assignments: NoInfer<RoleAssignment[]> | undefined;
        isLoading: boolean;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canGrant(): boolean;
    /** `<RoleIdentityCard>`, rendered by a ReactHost. */
    get RoleIdentityCard(): typeof RoleIdentityCard;
    get role_identity_card_props(): {
        role: Role;
        canEdit: boolean;
        actions: import("react").JSX.Element | undefined;
    };
    get part1_props(): {
        assignments: NoInfer<RoleAssignment[]> | undefined;
        isLoading: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        canGrant: boolean;
        setAssignOpen: (value: RoleDetail["assignOpen"] | ((prev: RoleDetail["assignOpen"]) => RoleDetail["assignOpen"])) => void;
        when: (iso: string) => string;
        askRevoke: (row: RoleAssignment) => Promise<void>;
    };
    /** A part of the screen still written in React (<DataTable> rowKey, emptyState, columns, rowActions, configurableColumns, t: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** `<RolePrivilegesCard>`, rendered by a ReactHost. */
    get RolePrivilegesCard(): typeof RolePrivilegesCard;
    get role_privileges_card_props(): {
        role: Role;
        catalogue: Privilege[];
        canEdit: boolean;
    };
    /** `<AssignRoleDialog>`, rendered by a ReactHost. */
    get AssignRoleDialog(): import("react").FunctionComponent<Readonly<import("./AssignRoleDialog").AssignRoleDialogProps>>;
    get assign_role_dialog_props(): Readonly<import("./AssignRoleDialog").AssignRoleDialogProps>;
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
    when(iso: string): string;
    askRevoke(row: RoleAssignment): Promise<void>;
    /** `setAssignOpen` of the TSX: a value, or an update of the previous one. */
    setAssignOpen(value: RoleDetail['assignOpen'] | ((prev: RoleDetail['assignOpen']) => RoleDetail['assignOpen'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RoleDetailStores = ReturnType<RoleDetail['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type RoleDetailHooks = ReturnType<RoleDetail['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<RoleDetailProps>>;
export default _default;
