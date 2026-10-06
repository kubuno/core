import { type MenuDropdownPos } from "@ui";
import RightRailCustomize from "./RightRailCustomize";
import { ViewBase } from './RightRail.kbview';
import * as __parts from './RightRail.parts';
export declare class RightRail extends ViewBase {
    accessor editing: boolean;
    accessor reopenMenu: MenuDropdownPos | null;
    tr: RightRailStores['t'];
    activeModuleId: string | null;
    togglePanel: (moduleId: string) => void;
    entries: RightRailStores['entries'];
    visible: RightRailStores['visible'];
    prefs: RightRailStores['prefs'];
    save: RightRailStores['save'];
    reopenEntries: RightRailStores['reopenEntries'];
    reopen: ((id: string) => void) | null;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        activeModuleId: string | null;
        togglePanel: (moduleId: string) => void;
        entries: import("../store/rightPanelStore").RailEntry[];
        visible: import("../store/rightPanelStore").RailEntry[];
        prefs: import("../hooks/useRightRailPrefs").RightRailPrefs;
        save: (next: import("../hooks/useRightRailPrefs").RightRailPrefs) => void;
        reopenEntries: import("./store/dockReopenStore").DockReopenEntry[];
        reopen: ((id: string) => void) | null;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get customiseLabel(): string;
    get reopenLabel(): string;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get part1_props(): {
        visible: import("../store/rightPanelStore").RailEntry[];
        activeModuleId: string | null;
        togglePanel: (moduleId: string) => void;
    };
    /** A part of the screen still written in React (a list callback destructuring its item). */
    get Part1(): typeof __parts.Part1;
    get show_reopen_entries(): boolean;
    get part2_props(): {
        reopenLabel: string;
        reopenEntries: import("./store/dockReopenStore").DockReopenEntry[];
        setReopenMenu: (value: MenuDropdownPos | null | ((prev: MenuDropdownPos | null) => MenuDropdownPos | null)) => void;
    };
    /** A part of the screen still written in React (<ToolTip> label, side: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get show_visible(): boolean;
    get part3_props(): {
        customiseLabel: string;
        setEditing: (value: RightRail["editing"] | ((prev: RightRail["editing"]) => RightRail["editing"])) => void;
    };
    /** A part of the screen still written in React (<ToolTip> label, side: no .kbview property). */
    get Part3(): typeof __parts.Part3;
    /** `<RightRailCustomize>`, rendered by a ReactHost. */
    get RightRailCustomize(): typeof RightRailCustomize;
    get right_rail_customize_props(): {
        entries: import("../store/rightPanelStore").RailEntry[];
        prefs: import("../hooks/useRightRailPrefs").RightRailPrefs;
        onSave: (next: import("../hooks/useRightRailPrefs").RightRailPrefs) => void;
        onClose: () => void;
    };
    get show_reopen_menu(): boolean;
    get part4_props(): {
        reopenEntries: import("./store/dockReopenStore").DockReopenEntry[];
        reopen: ((id: string) => void) | null;
        reopenMenu: MenuDropdownPos;
        setReopenMenu: (value: MenuDropdownPos | null | ((prev: MenuDropdownPos | null) => MenuDropdownPos | null)) => void;
    };
    /** A part of the screen still written in React (<ContextMenu> pos, onClose: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    get visible2(): boolean;
    get visible3(): boolean;
    /** `setReopenMenu` of the TSX: a value, or an update of the previous one. */
    setReopenMenu(value: MenuDropdownPos | null | ((prev: MenuDropdownPos | null) => MenuDropdownPos | null)): void;
    /** `setEditing` of the TSX: a value, or an update of the previous one. */
    setEditing(value: RightRail['editing'] | ((prev: RightRail['editing']) => RightRail['editing'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RightRailStores = ReturnType<RightRail['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
