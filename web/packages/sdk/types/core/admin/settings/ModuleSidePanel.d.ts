import type { AdminModule, ModuleSettingGroup } from "../adminModules";
import { type ActiveScope } from "./scopeTypes";
import { ViewBase } from './ModuleSidePanel.kbview';
import * as __parts from './ModuleSidePanel.parts';
export interface ModuleSidePanelProps {
    module: AdminModule;
    /** The pages the module declares, in manifest order. Empty is the normal case. */
    groups: ModuleSettingGroup[];
    /** The page on screen — the row that wears the "you are here" pill. */
    activeGroup: string | null;
    /** Does the module declare anything a unit may override? */
    scopable: boolean;
    scope: ActiveScope;
    onScopeChange: (next: ActiveScope) => void;
}
export declare class ModuleSidePanel extends ViewBase {
    accessor openPages: boolean;
    accessor openScope: boolean;
    tr: ModuleSidePanelStores['t'];
    overridingUnits: Set<string>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        instanceResolved: {
            byKey: Map<string, import("./scopeTypes").ResolvedSetting>;
            isLoading: boolean;
            isError: boolean;
        };
        overridingUnits: Set<string>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get hasPages(): boolean;
    get Glyph(): import("../nav/moduleGlyph").ModuleGlyph | null;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get show_glyph(): boolean;
    get part1_props(): {
        Glyph: import("../nav/moduleGlyph").ModuleGlyph;
    };
    /** A part of the screen still written in React (<Glyph> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        openPages: boolean;
        setOpenPages: (value: ModuleSidePanel["openPages"] | ((prev: ModuleSidePanel["openPages"]) => ModuleSidePanel["openPages"])) => void;
        groups: ModuleSettingGroup[];
        activeGroup: string | null;
        module: AdminModule;
    };
    /** A part of the screen still written in React (<Section> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        openScope: boolean;
        setOpenScope: (value: ModuleSidePanel["openScope"] | ((prev: ModuleSidePanel["openScope"]) => ModuleSidePanel["openScope"])) => void;
        scope: ActiveScope;
        onScopeChange: (next: ActiveScope) => void;
        overridingUnits: Set<string>;
    };
    /** A part of the screen still written in React (<Section> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    /** `setOpenPages` of the TSX: a value, or an update of the previous one. */
    setOpenPages(value: ModuleSidePanel['openPages'] | ((prev: ModuleSidePanel['openPages']) => ModuleSidePanel['openPages'])): void;
    /** `setOpenScope` of the TSX: a value, or an update of the previous one. */
    setOpenScope(value: ModuleSidePanel['openScope'] | ((prev: ModuleSidePanel['openScope']) => ModuleSidePanel['openScope'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModuleSidePanelStores = ReturnType<ModuleSidePanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ModuleSidePanelHooks = ReturnType<ModuleSidePanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ModuleSidePanelProps>>;
export default _default;
