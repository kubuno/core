/**
 * Code-behind of `ModuleAdminSettings.kbview` (converted from `ModuleAdminSettings.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import type { ModuleSettingGroup } from "./adminModules";
import type { ModuleAdminSection } from "../slots/SlotRegistry";
import { type ActiveScope, type ResolvedSetting } from "./settings/scopeTypes";
import { type SettingItem } from "./settings/moduleSettingSchema";
import { ViewBase } from './ModuleAdminSettings.kbview';
import * as __parts from './ModuleAdminSettings.parts';
export declare function useModuleInstanceSettings(moduleId: string, enabled?: boolean): {
    items: SettingItem[];
    isLoading: boolean;
    isError: boolean;
    refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<{
        settings: SettingItem[];
    }>, Error>>;
};
export interface ModuleAdminSettingsProps {
    moduleId: string;
    /** The page being shown. `null` = the module declares none (single stack). */
    group?: string | null;
    /** Every page the module declares — what the filter names its hits by. */
    groups?: ModuleSettingGroup[];
    /** The module's own views that asked for a tab on THIS page. */
    extraTabs?: ModuleAdminSection[];
    /** WHO the values on screen belong to — chosen in the page's side card. */
    scope?: ActiveScope;
}
export declare class ModuleAdminSettings extends ViewBase {
    accessor edits: Record<string, unknown>;
    accessor busySection: string | null;
    accessor savedSection: string | null;
    accessor error: string | null;
    accessor filter: string;
    accessor opened: Record<string, boolean>;
    accessor advOpen: Record<string, boolean>;
    accessor tab: string | null;
    accessor chainKey: string | null;
    tr: ModuleAdminSettingsStores['t'];
    qc: ModuleAdminSettingsStores['qc'];
    items: SettingItem[];
    isLoading: boolean;
    confirm: ModuleAdminSettingsStores['confirm'];
    confirmState: ModuleAdminSettingsStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    instanceResolved: {
        byKey: Map<string, ResolvedSetting>;
        isLoading: boolean;
        isError: boolean;
    };
    unitResolved: {
        byKey: Map<string, ResolvedSetting>;
        isLoading: boolean;
        isError: boolean;
    };
    byKey: Map<string, SettingItem>;
    invalidKeys: Set<string>;
    save: ModuleAdminSettingsHooks['save'];
    revert: ModuleAdminSettingsHooks['revert'];
    lock: ModuleAdminSettingsHooks['lock'];
    groupIds: Set<string>;
    matches: SettingItem[] | null;
    pageCategories: {
        category: string;
        basic: SettingItem[];
        advanced: SettingItem[];
        all: SettingItem[];
    }[];
    tabs: {
        id: string;
        label: string;
    }[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        qc: import("@tanstack/query-core").QueryClient;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        items: SettingItem[];
        isLoading: boolean;
        instanceResolved: {
            byKey: Map<string, ResolvedSetting>;
            isLoading: boolean;
            isError: boolean;
        };
        unitResolved: {
            byKey: Map<string, ResolvedSetting>;
            isLoading: boolean;
            isError: boolean;
        };
        byKey: Map<string, SettingItem>;
        invalidKeys: Set<string>;
        save: import("@tanstack/react-query").UseMutationResult<void, unknown, Record<string, unknown>, unknown>;
        revert: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, string, unknown>;
        lock: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, {
            key: string;
            locked: boolean;
        }, unknown>;
        groupIds: Set<string>;
        groupLabel: Map<string, string>;
        matches: SettingItem[] | null;
        pageItems: SettingItem[];
        pageCategories: {
            category: string;
            basic: SettingItem[];
            advanced: SettingItem[];
            all: SettingItem[];
        }[];
        tabs: {
            id: string;
            label: string;
        }[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get group(): string | null;
    get groups(): ModuleSettingGroup[];
    get extraTabs(): ModuleAdminSection[];
    get scope(): ActiveScope;
    get scopable(): boolean;
    get scoped(): boolean;
    get resolvedByKey(): Map<string, ResolvedSetting>;
    get paged(): boolean;
    get firstGroup(): string;
    get page(): string;
    get filtering(): boolean;
    get CATEGORY_TAB(): "cat:";
    get activeTab(): string;
    get dirtyCount(): number;
    get scopeAside(): import("react").JSX.Element;
    get ExtraTab(): import("react").ComponentType<{}> | null;
    get activeCategory(): {
        category: string;
        basic: SettingItem[];
        advanced: SettingItem[];
        all: SettingItem[];
    } | null;
    get showsSections(): boolean;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    get placeholder(): string;
    get show_filtering_matches(): boolean;
    get m_filter_scope_count(): number;
    get p_text(): string;
    get show_error(): boolean;
    get show_not_filtering(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_render_matches_matches(): {
        children: import("react").JSX.Element | (import("react").JSX.Element | null)[];
    };
    get show_not_paged(): boolean;
    get show_tabs(): boolean;
    get part1_props(): {
        tabs: {
            id: string;
            label: string;
        }[];
        activeTab: string;
        setTab: (value: string | null | ((prev: string | null) => string | null)) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Tabs> tabs: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_extra_tab(): boolean;
    get show_not_extra_tab(): boolean;
    get part2_props(): {
        ExtraTab: import("react").ComponentType<{}>;
    };
    /** A part of the screen still written in React (<ExtraTab> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    get show_active_category(): boolean;
    get show_not_active_category(): boolean;
    get content_category_section_active_tab_active_categ(): {
        children: import("react").JSX.Element;
    };
    get p_text2(): string;
    get visible2(): boolean;
    get visible3(): boolean;
    get visible4(): boolean;
    get visible5(): boolean;
    get visible6(): boolean;
    get visible7(): boolean;
    get part3_props(): {
        pageCategories: {
            category: string;
            basic: SettingItem[];
            advanced: SettingItem[];
            all: SettingItem[];
        }[];
        categorySection: (key: string, category: string, basic: SettingItem[], advanced: SettingItem[], onlyOne: boolean) => import("react").JSX.Element;
    };
    /** A part of the screen still written in React (a list whose item is not a single element). */
    get Part3(): typeof __parts.Part3;
    get visible8(): boolean;
    get visible9(): boolean;
    get visible10(): boolean;
    get visible11(): boolean;
    get visible12(): boolean;
    get show_shows_sections_dirty_count(): boolean;
    get text(): string;
    get content_elsewhere_action_object_keys(): {
        children: import("react").JSX.Element | null;
    };
    get show_chain_key(): boolean;
    /** `<InheritanceChainWindow>`, rendered by a ReactHost. */
    get InheritanceChainWindow(): import("react").FunctionComponent<Readonly<import("./settings/InheritanceChainWindow").InheritanceChainWindowProps>>;
    get inheritance_chain_window_props(): Readonly<import("./settings/InheritanceChainWindow").InheritanceChainWindowProps>;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof import("../../ui/ConfirmDialog").default;
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
    get visible13(): boolean;
    get visible14(): boolean;
    storedValue(s: SettingItem): unknown;
    shown(s: SettingItem): unknown;
    valueOf(key: string): unknown;
    instanceOnly(s: SettingItem): boolean;
    isReadOnly(s: SettingItem): boolean;
    setValue(item: SettingItem, v: unknown): void;
    reportError(e: unknown): void;
    afterWrite(written: string[]): Promise<void>;
    visible(s: SettingItem): boolean;
    categoryOf(s: SettingItem): string;
    splitByCategory(list: SettingItem[]): {
        category: string;
        basic: SettingItem[];
        advanced: SettingItem[];
        all: SettingItem[];
    }[];
    submitSection(sectionKey: string, keys: string[]): Promise<undefined>;
    cancelSection(keys: string[]): undefined;
    elsewhereAction(keys: string[]): import("react").JSX.Element | null;
    renderRow(s: SettingItem): import("react").JSX.Element;
    changedCount(list: SettingItem[]): number;
    categorySection(key: string, category: string, basic: SettingItem[], advanced: SettingItem[], onlyOne: boolean): import("react").JSX.Element;
    renderMatches(list: SettingItem[]): import("react").JSX.Element | (import("react").JSX.Element | null)[];
    callout_dismiss(_sender: unknown, _args: EventArgs): undefined;
    /** `setTab` of the TSX: a value, or an update of the previous one. */
    setTab(value: string | null | ((prev: string | null) => string | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModuleAdminSettingsStores = ReturnType<ModuleAdminSettings['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ModuleAdminSettingsHooks = ReturnType<ModuleAdminSettings['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ModuleAdminSettingsProps>>;
export default _default;
export type { SettingItem } from './settings/moduleSettingSchema';
export type { ResolvedSetting };
