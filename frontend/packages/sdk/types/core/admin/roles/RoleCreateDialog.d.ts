/**
 * Code-behind of `RoleCreateDialog.kbview` (converted from `RoleCreateDialog.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import type { Privilege } from "../../authz/types";
import { ViewBase } from './RoleCreateDialog.kbview';
import * as __parts from './RoleCreateDialog.parts';
export type RoleCreateDialogProps = {
    catalogue: Privilege[];
    onClose: () => void;
};
export declare class RoleCreateDialog extends ViewBase {
    accessor name: string;
    accessor slug: string;
    accessor slugTouched: boolean;
    accessor description: string;
    accessor error: string;
    tr: RoleCreateDialogStores['t'];
    toast: RoleCreateDialogStores['toast'];
    selected: Set<string>;
    setSelected: RoleCreateDialogStores['setSelected'];
    keys: string[];
    blockers: string[];
    create: RoleCreateDialogHooks['create'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toast: import("@ui").ToastApi;
        selected: Set<string>;
        setSelected: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        keys: string[];
        byKey: Map<string, Privilege>;
        blockers: string[];
        create: import("@tanstack/react-query").UseMutationResult<any, Error, import("./api").RolePayload, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get enabled_unless_name_trim(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        name: string;
        setName: (value: RoleCreateDialog["name"] | ((prev: RoleCreateDialog["name"]) => RoleCreateDialog["name"])) => void;
        slugTouched: boolean;
        setSlug: (value: RoleCreateDialog["slug"] | ((prev: RoleCreateDialog["slug"]) => RoleCreateDialog["slug"])) => void;
    };
    /** A part of the screen still written in React (<TextField> label: an object value for a text property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        description: string;
        setDescription: (value: RoleCreateDialog["description"] | ((prev: RoleCreateDialog["description"]) => RoleCreateDialog["description"])) => void;
    };
    /** A part of the screen still written in React (<TextArea> rows: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<FieldLabel> is no .kbview element (../sections/resources/FieldLabel#default)). */
    get Part3(): typeof __parts.Part3;
    get show_blockers(): boolean;
    get show_not_blockers(): boolean;
    get show_selected_size(): boolean;
    get visible(): boolean;
    /** `<PrivilegeList>`, rendered by a ReactHost. */
    get PrivilegeList(): import("react").FunctionComponent<Readonly<import("./PrivilegeList").PrivilegeListProps>>;
    get privilege_list_props(): {
        keys: string[];
        catalogue: Privilege[];
        selected: Set<string>;
        onToggle: (key: string) => void;
    };
    get show_error(): boolean;
    toggle(key: string): void;
    submit(e?: React.FormEvent): void;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    panel_submit(_sender: unknown, args: EventArgs): void;
    text_field_text_changed(_sender: unknown, args: EventArgs): void;
    /** `setName` of the TSX: a value, or an update of the previous one. */
    setName(value: RoleCreateDialog['name'] | ((prev: RoleCreateDialog['name']) => RoleCreateDialog['name'])): void;
    /** `setSlug` of the TSX: a value, or an update of the previous one. */
    setSlug(value: RoleCreateDialog['slug'] | ((prev: RoleCreateDialog['slug']) => RoleCreateDialog['slug'])): void;
    /** `setDescription` of the TSX: a value, or an update of the previous one. */
    setDescription(value: RoleCreateDialog['description'] | ((prev: RoleCreateDialog['description']) => RoleCreateDialog['description'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RoleCreateDialogStores = ReturnType<RoleCreateDialog['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type RoleCreateDialogHooks = ReturnType<RoleCreateDialog['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<RoleCreateDialogProps>>;
export default _default;
