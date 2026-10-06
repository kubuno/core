import type { Privilege } from "../../authz/types";
import { ViewBase } from './PrivilegeList.kbview';
import * as __parts from './PrivilegeList.parts';
export interface PrivilegeGroup {
    domain: string;
    items: Privilege[];
}
export declare function groupPrivileges(keys: string[], catalogue: Privilege[]): PrivilegeGroup[];
export interface PrivilegeListProps {
    /** Keys to render. In the editor this is the whole catalogue. */
    keys: string[];
    catalogue: Privilege[];
    /** Present → checkable editor; absent → read-only display. */
    selected?: Set<string>;
    onToggle?: (key: string) => void;
    /** Bleed the bands to a `px-5` parent's edges, like the surrounding cards. */
    bleed?: boolean;
}
export declare class PrivilegeList extends ViewBase {
    domainLabel: (domain: string) => string;
    privilegeLabel: PrivilegeListStores['privilegeLabel'];
    groups: PrivilegeGroup[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        domainLabel: (domain: string) => string;
        privilegeLabel: (entry: import("../../authz/labels").KeyedEntry) => string;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        groups: PrivilegeGroup[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get bleed(): boolean;
    get editing(): boolean;
    get pad(): "px-5" | "px-3";
    get show_case_1(): boolean;
    get show_main(): boolean;
    get div_class(): "" | "-mx-5";
    get p_class(): string;
    /** A part of the screen still written in React (a list inside a list (nested Repeater)). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `groups`. */
    get rows_groups(): {
        g: PrivilegeGroup;
        p_text: string | undefined;
        part1_props: {
            g: PrivilegeGroup;
            privilegeLabel: (entry: import("../../authz/labels").KeyedEntry) => string;
            editing: boolean;
            onToggle: ((key: string) => void) | undefined;
            pad: "px-3" | "px-5";
            selected: Set<string> | undefined;
        } | undefined;
        key: string;
    }[];
}
/** What `useStores()` gives (the types of the fields it fills). */
export type PrivilegeListStores = ReturnType<PrivilegeList['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type PrivilegeListHooks = ReturnType<PrivilegeList['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<PrivilegeListProps>>;
export default _default;
