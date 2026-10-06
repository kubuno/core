/**
 * Code-behind of `OrgUnitPicker.kbview` (converted from `OrgUnitPicker.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import type { OrgUnit } from "../types";
import { ViewBase } from './OrgUnitPicker.kbview';
import * as __parts from './OrgUnitPicker.parts';
export type OrgUnitPickerProps = {
    title: string;
    currentId: string | null;
    excludeId?: string;
    onSelect: (id: string) => void;
    onClose: () => void;
};
export declare class OrgUnitPicker extends ViewBase {
    accessor addUnder: string | null;
    accessor name: string;
    accessor needle: string;
    accessor createError: string;
    tr: OrgUnitPickerStores['t'];
    qc: OrgUnitPickerStores['qc'];
    data: OrgUnitPickerStores['data'];
    sel: string | null;
    setSel: OrgUnitPickerHooks['setSel'];
    expanded: Set<string>;
    setExpanded: OrgUnitPickerStores['setExpanded'];
    treeRef: OrgUnitPickerStores['treeRef'];
    create: OrgUnitPickerHooks['create'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        qc: import("@tanstack/query-core").QueryClient;
        data: NoInfer<OrgUnit[]> | undefined;
        expanded: Set<string>;
        setExpanded: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
        treeRef: import("react").RefObject<HTMLDivElement | null>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        sel: string | null;
        setSel: import("react").Dispatch<import("react").SetStateAction<string | null>>;
        create: import("@tanstack/react-query").UseMutationResult<OrgUnit, Error, {
            name: string;
            parent_id: string;
        }, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get units(): NoInfer<OrgUnit[]>;
    get root(): OrgUnit | undefined;
    get visible(): {
        u: OrgUnit;
        depth: number;
        kids: number;
    }[];
    get results(): OrgUnit[];
    get enabled_unless_sel(): boolean;
    get part1_props(): {
        needle: string;
        setNeedle: (value: OrgUnitPicker["needle"] | ((prev: OrgUnitPicker["needle"]) => OrgUnitPicker["needle"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<TextField LeftIcon>: an icon size the element cannot take). */
    get Part1(): typeof __parts.Part1;
    get show_needle_trim(): boolean;
    get show_not_needle_trim(): boolean;
    get show_results(): boolean;
    get show_not_results(): boolean;
    /** The rows of the Repeater over `results`. */
    get rows_results(): {
        u: OrgUnit;
        button_class: string | undefined;
        show_ou_path_units_u: boolean | undefined;
        span_text: string | undefined;
        key: string;
    }[];
    get visible2(): boolean;
    get visible3(): boolean;
    get show_root(): boolean;
    get show_not_root(): boolean;
    get part2_props(): {
        treeRef: import("react").RefObject<HTMLDivElement | null>;
        title: string;
        onTreeKey: (e: React.KeyboardEvent) => void;
        visible: {
            u: OrgUnit;
            depth: number;
            kids: number;
        }[];
        renderRow: ({ u, depth, kids }: {
            u: OrgUnit;
            depth: number;
            kids: number;
        }) => import("react").JSX.Element;
    };
    /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
    get Part2(): typeof __parts.Part2;
    get visible4(): boolean;
    get visible5(): boolean;
    toggle(id: string): void;
    walk(u: OrgUnit, depth: number): void;
    onTreeKey(e: React.KeyboardEvent): void;
    renderRow({ u, depth, kids }: {
        u: OrgUnit;
        depth: number;
        kids: number;
    }): import("react").JSX.Element;
    excluded(u: OrgUnit): boolean;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
    floating_window_confirm(_sender: unknown, _args: EventArgs): void;
    floating_window_close(_sender: unknown, _args: EventArgs): void;
    panel_click(_sender: unknown, args: MouseEventArgs): undefined;
    /** `setNeedle` of the TSX: a value, or an update of the previous one. */
    setNeedle(value: OrgUnitPicker['needle'] | ((prev: OrgUnitPicker['needle']) => OrgUnitPicker['needle'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type OrgUnitPickerStores = ReturnType<OrgUnitPicker['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type OrgUnitPickerHooks = ReturnType<OrgUnitPicker['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<OrgUnitPickerProps>>;
export default _default;
