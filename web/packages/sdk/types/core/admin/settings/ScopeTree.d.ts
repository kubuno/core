/**
 * Code-behind of `ScopeTree.kbview` (converted from `ScopeTree.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { OrgUnit } from "../../types";
import { type ActiveScope } from "./scopeTypes";
import { ViewBase } from './ScopeTree.kbview';
import * as __parts from './ScopeTree.parts';
export interface ScopeTreeProps {
    scope: ActiveScope;
    onChange: (next: ActiveScope) => void;
    /** Units holding their own value for at least one setting of this page —
     *  marked with a dot, so a branch that diverges is findable without opening
     *  it. Empty is the normal case and shows nothing. */
    overriding?: Set<string>;
}
export declare class ScopeTree extends ViewBase {
    accessor needle: string;
    tr: ScopeTreeStores['t'];
    expanded: Set<string>;
    setExpanded: ScopeTreeStores['setExpanded'];
    units: ScopeTreeStores['units'];
    openPath: Set<string>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        expanded: Set<string>;
        setExpanded: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
        data: NoInfer<OrgUnit[]> | undefined;
        units: OrgUnit[];
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        openPath: Set<string>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get root(): OrgUnit | null;
    get rows(): {
        unit: OrgUnit;
        depth: number;
        kids: number;
    }[];
    get filtering(): boolean;
    get results(): OrgUnit[];
    get isInstance(): boolean;
    get instanceRow(): import("react").JSX.Element;
    get show_units_filter_threshold(): boolean;
    get part1_props(): {
        needle: string;
        setNeedle: (value: ScopeTree["needle"] | ((prev: ScopeTree["needle"]) => ScopeTree["needle"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<TextField LeftIcon>: an icon size the element cannot take). */
    get Part1(): typeof __parts.Part1;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_instance_row(): {
        children: import("react").JSX.Element;
    };
    get show_not_filtering(): boolean;
    get show_results(): boolean;
    get show_not_results(): boolean;
    /** The rows of the Repeater over `results`. */
    get rows_results(): {
        u: OrgUnit;
        button_class: string | undefined;
        span_text: string | undefined;
        key: string;
    }[];
    get visible(): boolean;
    get visible2(): boolean;
    get part2_props(): {
        rows: {
            unit: OrgUnit;
            depth: number;
            kids: number;
        }[];
        scope: ActiveScope;
        isOpen: (id: string) => boolean;
        toggle: (id: string) => void;
        onChange: (next: ActiveScope) => void;
        rowClass: (selected: boolean) => string;
        overriding: Set<string> | undefined;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (a list callback destructuring its item). */
    get Part2(): typeof __parts.Part2;
    isOpen(id: string): boolean;
    toggle(id: string): void;
    walk(u: OrgUnit, depth: number): void;
    rowClass(selected: boolean): string;
    panel_click(_sender: unknown, args: MouseEventArgs): undefined;
    /** `setNeedle` of the TSX: a value, or an update of the previous one. */
    setNeedle(value: ScopeTree['needle'] | ((prev: ScopeTree['needle']) => ScopeTree['needle'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ScopeTreeStores = ReturnType<ScopeTree['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ScopeTreeHooks = ReturnType<ScopeTree['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ScopeTreeProps>>;
export default _default;
