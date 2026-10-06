/**
 * Code-behind of `ModulesPanel.kbview` (converted from `ModulesPanel.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type DataTableColumn, type DataTableRowAction } from "@ui";
import type { AdminSectionProps } from "./sections/registry";
import { type AdminModule, type ModuleLiveState } from "./adminModules";
import { ViewBase } from './ModulesPanel.kbview';
import * as __parts from './ModulesPanel.parts';
export type { AdminSectionProps };
export declare class ModulesPanel extends ViewBase {
    accessor errorMsg: string | null;
    accessor infoMsg: string | null;
    accessor showMarketplace: boolean;
    accessor query: string;
    tr: ModulesPanelStores['t'];
    queryClient: ModulesPanelStores['queryClient'];
    data: ModulesPanelStores['data'];
    isLoading: boolean;
    liveState: (module: AdminModule) => ModuleLiveState;
    defaultModulePath: string | null | undefined;
    setDefault: ModulesPanelHooks['setDefault'];
    toggle: ModulesPanelStores['toggle'];
    rows: AdminModule[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        queryClient: import("@tanstack/query-core").QueryClient;
        data: NoInfer<AdminModule[]> | undefined;
        isLoading: boolean;
        liveState: (module: AdminModule) => ModuleLiveState;
        defaultModulePath: string | null | undefined;
        toggle: import("@tanstack/react-query").UseMutationResult<import("./adminModules").ToggleResult, Error, {
            id: string;
            is_enabled: boolean;
        }, {
            previous: AdminModule[] | undefined;
        }>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        setDefault: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string | null, unknown>;
        rows: AdminModule[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get columns(): DataTableColumn<AdminModule>[];
    get rowActions(): DataTableRowAction<AdminModule>[];
    get show_case_1(): boolean;
    /** `<MarketplacePanel>`, rendered by a ReactHost. */
    get MarketplacePanel(): import("react").FunctionComponent<Readonly<import("./MarketplacePanel").MarketplacePanelProps>>;
    get marketplace_panel_props(): Readonly<import("./MarketplacePanel").MarketplacePanelProps>;
    get show_main(): boolean;
    get show_data(): boolean;
    get m_count_count(): number;
    get show_info_msg(): boolean;
    get show_error_msg(): boolean;
    get part1_props(): {
        rows: AdminModule[];
        columns: DataTableColumn<AdminModule>[];
        isLoading: boolean;
        query: string;
        setQuery: (value: ModulesPanel["query"] | ((prev: ModulesPanel["query"]) => ModulesPanel["query"])) => void;
        rowActions: DataTableRowAction<AdminModule>[];
        open: (mod: AdminModule) => void | Promise<void>;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, filtered, onClearFilters, rowActions, onRowClick, defaultSort, t, toolbar: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    flip(id: string, is_enabled: boolean): void;
    open(mod: AdminModule): void | Promise<void>;
    isDefault(mod: AdminModule): boolean;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setQuery` of the TSX: a value, or an update of the previous one. */
    setQuery(value: ModulesPanel['query'] | ((prev: ModulesPanel['query']) => ModulesPanel['query'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModulesPanelStores = ReturnType<ModulesPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ModulesPanelHooks = ReturnType<ModulesPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
