/**
 * Code-behind of `ApiTokenScopePicker.kbview` (converted from `ApiTokenScopePicker.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { TokenScope } from "../../types";
import { ViewBase } from './ApiTokenScopePicker.kbview';
import * as __parts from './ApiTokenScopePicker.parts';
export type ApiTokenScopePickerProps = {
    scopes: TokenScope[];
    selected: string[];
    onChange: (keys: string[]) => void;
};
export declare class ApiTokenScopePicker extends ViewBase {
    accessor query: string;
    tr: ApiTokenScopePickerStores['t'];
    domainLabel: (domain: string) => string;
    privilegeLabel: ApiTokenScopePickerStores['privilegeLabel'];
    privilegeDescription: ApiTokenScopePickerStores['privilegeDescription'];
    collapsed: Set<string>;
    setCollapsed: ApiTokenScopePickerStores['setCollapsed'];
    chosen: Set<string>;
    groups: [string, TokenScope[]][];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        domainLabel: (domain: string) => string;
        privilegeLabel: (entry: import("../../authz/labels").KeyedEntry) => string;
        privilegeDescription: (entry: import("../../authz/labels").KeyedEntry) => string | null;
        collapsed: Set<string>;
        setCollapsed: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        chosen: Set<string>;
        groups: [string, TokenScope[]][];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get part1_props(): {
        chosen: Set<string>;
        toggle: (key: string) => void;
        scopes: TokenScope[];
        privilegeLabel: (entry: import("../../authz/labels").KeyedEntry) => string;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<ComboBox> searchPlaceholder, width, maxHeight: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_selected(): boolean;
    /** The rows of the Repeater over `selected`. */
    get rows_selected(): {
        key: string;
        scope: TokenScope | undefined;
        text: string | undefined;
        rowKey: string;
    }[];
    get part2_props(): {
        groups: [string, TokenScope[]][];
        chosen: Set<string>;
        collapsed: Set<string>;
        setCollapsed: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
        domainLabel: (domain: string) => string;
        toggleGroup: (keys: string[], allOn: boolean) => void;
        t: import("i18next").TFunction<"translation", undefined>;
        toggle: (key: string) => void;
        privilegeLabel: (entry: import("../../authz/labels").KeyedEntry) => string;
        privilegeDescription: (entry: import("../../authz/labels").KeyedEntry) => string | null;
    };
    /** A part of the screen still written in React (a list callback destructuring its item). */
    get Part2(): typeof __parts.Part2;
    get show_groups(): boolean;
    toggle(key: string): void;
    toggleGroup(keys: string[], allOn: boolean): void;
    panel_click(_sender: unknown, args: MouseEventArgs): undefined;
    panel_click2(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ApiTokenScopePickerStores = ReturnType<ApiTokenScopePicker['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ApiTokenScopePickerHooks = ReturnType<ApiTokenScopePicker['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ApiTokenScopePickerProps>>;
export default _default;
