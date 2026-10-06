/**
 * Code-behind of `OrgUnitScopePanel.kbview` (converted from `OrgUnitScopePanel.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views';
import { useNavigate } from 'react-router-dom';
import type { OrgUnit } from "../types";
import { ViewBase } from './OrgUnitScopePanel.kbview';
import * as __parts from './OrgUnitScopePanel.parts';
export interface OrgUnitScope {
    /** `all` ignores `unitIds`: the listing spans every unit the caller may see. */
    mode: 'all' | 'selected';
    unitIds: string[];
    descendants: boolean;
}
export declare const ALL_UNITS: OrgUnitScope;
interface Props {
    units: OrgUnit[];
    value: OrgUnitScope;
    onChange: (next: OrgUnitScope) => void;
    /** Accounts per unit, own count only — the panel adds nothing up itself. */
    counts?: Record<string, number>;
    collapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
}
export type { Props };
export declare class OrgUnitScopePanel extends ViewBase {
    accessor needle: string;
    accessor multi: boolean;
    tr: OrgUnitScopePanelStores['t'];
    expanded: Set<string>;
    setExpanded: OrgUnitScopePanelStores['setExpanded'];
    matching: Set<string> | null;
    navigate: ReturnType<typeof useNavigate>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        expanded: Set<string>;
        setExpanded: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        matching: Set<string> | null;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get root(): OrgUnit | undefined;
    get rows(): {
        u: OrgUnit;
        depth: number;
        kids: number;
    }[];
    get selected(): Set<string>;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get selected_value(): boolean;
    get selected_value2(): boolean;
    /** The rows of the Repeater over `([false, true] as const)`. */
    get rows_items(): {
        m: boolean;
        button_class: string | undefined;
        text: string | undefined;
        key: string;
    }[];
    get show_rows(): boolean;
    get part1_props(): {
        rows: {
            u: OrgUnit;
            depth: number;
            kids: number;
        }[];
        matching: Set<string> | null;
        expanded: Set<string>;
        selected: Set<string>;
        pick: (id: string) => void;
        toggle: (id: string) => void;
        multi: boolean;
        counts: Record<string, number> | undefined;
    };
    /** A part of the screen still written in React (a list callback destructuring its item). */
    get Part1(): typeof __parts.Part1;
    get show_value_mode_selected(): boolean;
    get part2_props(): {
        value: OrgUnitScope;
        onChange: (next: OrgUnitScope) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<CheckBox> labelClassName: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get href(): string;
    toggle(id: string): void;
    walk(u: OrgUnit, depth: number): void;
    pick(id: string): void;
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    radio_button_checked_changed(_sender: unknown, _args: ValueChangedEventArgs): undefined;
    radio_button_checked_changed2(_sender: unknown, _args: ValueChangedEventArgs): undefined;
    panel_click3(_sender: unknown, args: MouseEventArgs): undefined;
    link_label_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type OrgUnitScopePanelStores = ReturnType<OrgUnitScopePanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type OrgUnitScopePanelHooks = ReturnType<OrgUnitScopePanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
