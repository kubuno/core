/**
 * Code-behind of `AssignRoleDialog.kbview` (converted from `AssignRoleDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views';
import { Users } from "lucide-react";
import { type Privilege, type Role } from "../../authz/types";
import type { OrgUnit, User, UserGroup } from "../../types";
import { ViewBase } from './AssignRoleDialog.kbview';
import * as __parts from './AssignRoleDialog.parts';
type SubjectKind = 'user' | 'group';
type Scope = 'instance' | 'org_unit';
export type AssignRoleDialogProps = {
    role: Role;
    catalogue: Privilege[];
    onClose: () => void;
};
export declare class AssignRoleDialog extends ViewBase {
    accessor kind: SubjectKind;
    accessor user: User | null;
    accessor groupId: string | null;
    accessor scope: Scope;
    accessor unitId: string | null;
    accessor pickerOpen: boolean;
    accessor expiresAt: string | null;
    accessor query: string;
    accessor debounced: string;
    accessor error: string;
    tr: AssignRoleDialogStores['t'];
    toast: AssignRoleDialogStores['toast'];
    can: AssignRoleDialogStores['can'];
    roleName: (role: Role) => string;
    found: AssignRoleDialogHooks['found'];
    groups: AssignRoleDialogHooks['groups'];
    units: AssignRoleDialogStores['units'];
    blockers: Privilege[];
    create: AssignRoleDialogHooks['create'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toast: import("@ui").ToastApi;
        can: import("../../authz/types").CanFn;
        roleName: (role: Role) => string;
        units: NoInfer<OrgUnit[]> | undefined;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        found: NoInfer<User[]> | undefined;
        groups: NoInfer<UserGroup[]> | undefined;
        blockers: Privilege[];
        create: import("@tanstack/react-query").UseMutationResult<any, Error, import("./api").AssignmentPayload, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canGroups(): boolean;
    get subjectReady(): boolean;
    get scopeReady(): boolean;
    get enabled_unless_subject_ready_scope_ready(): boolean;
    get title(): string;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_kind_button_user_t(): {
        children: import("react").JSX.Element;
    };
    get content_kind_button_group_t(): {
        children: import("react").JSX.Element;
    };
    get show_kind_user(): boolean;
    get show_not_kind_user(): boolean;
    get show_user(): boolean;
    get show_not_user(): boolean;
    /** `<Avatar>`, rendered by a ReactHost. */
    get Avatar(): typeof __parts.Avatar;
    get avatar_props(): {
        user: User;
    };
    get span_text(): string;
    get span_text2(): string;
    get show_debounced_found(): boolean;
    /** `<Avatar>`, rendered by a ReactHost. */
    get Avatar2(): typeof __parts.Avatar;
    /** The rows of the Repeater over `found!`. */
    get rows_found(): {
        u: User;
        avatar_props: {
            user: User;
        } | undefined;
        span_text: string | undefined;
        key: string;
    }[];
    get visible(): boolean;
    get visible2(): boolean;
    get part1_props(): {
        groupId: string | null;
        setGroupId: (value: string | null | ((prev: string | null) => string | null)) => void;
        groups: NoInfer<UserGroup[]> | undefined;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<ComboBox> width: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get selected_value(): boolean;
    get label_class(): string;
    get tooltip(): string | undefined;
    get selected_value2(): boolean;
    get enabled_unless_role_ou_delegable(): boolean;
    get span_class(): string;
    get show_not_role_ou_delegable(): boolean;
    get show_scope_org_unit(): boolean;
    get span_text3(): string;
    get text(): string;
    get show_role_ou_delegable(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        role: Role;
        blockers: Privilege[];
    };
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        expiresAt: string | null;
        setExpiresAt: (value: string | null | ((prev: string | null) => string | null)) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<DatePicker> clearable, minDate: no .kbview property). */
    get Part3(): typeof __parts.Part3;
    get show_error(): boolean;
    /** `<OrgUnitPicker>`, rendered by a ReactHost. */
    get OrgUnitPicker(): import("react").FunctionComponent<Readonly<import("../OrgUnitPicker").OrgUnitPickerProps>>;
    get org_unit_picker_props(): Readonly<import("../OrgUnitPicker").OrgUnitPickerProps>;
    unitName(id: string | null): string;
    submit(e?: React.FormEvent): void;
    kindButton(value: SubjectKind, label: string, Icon: typeof Users, enabled?: boolean): import("react").JSX.Element;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    panel_submit(_sender: unknown, args: EventArgs): void;
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click2(_sender: unknown, args: MouseEventArgs): undefined;
    radio_button_checked_changed(_sender: unknown, _args: ValueChangedEventArgs): void;
    radio_button_checked_changed2(_sender: unknown, _args: ValueChangedEventArgs): void;
    panel_click3(_sender: unknown, args: MouseEventArgs): undefined;
    /** `setGroupId` of the TSX: a value, or an update of the previous one. */
    setGroupId(value: string | null | ((prev: string | null) => string | null)): void;
    /** `setExpiresAt` of the TSX: a value, or an update of the previous one. */
    setExpiresAt(value: string | null | ((prev: string | null) => string | null)): void;
    /** `setUnitId` of the TSX: a value, or an update of the previous one. */
    setUnitId(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AssignRoleDialogStores = ReturnType<AssignRoleDialog['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AssignRoleDialogHooks = ReturnType<AssignRoleDialog['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AssignRoleDialogProps>>;
export default _default;
