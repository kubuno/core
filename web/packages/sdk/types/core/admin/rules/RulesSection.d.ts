/**
 * Code-behind of `RulesSection.kbview` (converted from `RulesSection.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type DataTableColumn, type DataTableRowAction } from "@ui";
import type { AdminSectionProps } from "../sections/registry";
import { type Pane } from "./RuleEditor";
import { type Mode, type Rule } from "./types";
import { ViewBase } from './RulesSection.kbview';
import * as __parts from './RulesSection.parts';
export type { AdminSectionProps };
export declare class RulesSection extends ViewBase {
    accessor q: string;
    accessor modeFilter: string;
    accessor moduleFilter: string;
    tr: RulesSectionStores['t'];
    i18n: RulesSectionStores['i18n'];
    can: RulesSectionStores['can'];
    toast: RulesSectionStores['toast'];
    confirm: RulesSectionStores['confirm'];
    confirmState: RulesSectionStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: RulesSectionHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: RulesSectionHooks['refetch'];
    recent: RulesSectionHooks['recent'];
    setMode: RulesSectionStores['setMode'];
    remove: RulesSectionStores['remove'];
    create: RulesSectionStores['create'];
    recentCount: Map<string, number>;
    triggerLabel: Map<string, string>;
    modules: string[];
    rows: Rule[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        can: import("../../authz/types").CanFn;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        catalog: import("@tanstack/react-query").UseQueryResult<NoInfer<import("./types").Catalog>, Error>;
        setMode: import("@tanstack/react-query").UseMutationResult<Rule, Error, {
            id: string;
            mode: Mode;
            change_note?: string;
        }, unknown>;
        remove: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string, unknown>;
        create: import("@tanstack/react-query").UseMutationResult<Rule, Error, import("./types").RuleInput, unknown>;
        triggerLabel: Map<string, string>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<import("./types").RulesListResponse> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./types").RulesListResponse>, Error>>;
        recent: import("@tanstack/react-query").UseQueryResult<NoInfer<import("./types").ExecutionRow[]>, Error>;
        recentCount: Map<string, number>;
        modules: string[];
        rows: Rule[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canWrite(): boolean;
    get openId(): string | null;
    get creating(): boolean;
    get pane(): Pane | undefined;
    get rules(): Rule[];
    get columns(): DataTableColumn<Rule>[];
    get rowActions(): DataTableRowAction<Rule>[];
    get anyFilter(): boolean;
    get toolbar(): import("react").JSX.Element;
    get armed(): number;
    get simulating(): number;
    get show_case_1(): boolean;
    /** `<RuleEditor>`, rendered by a ReactHost. */
    get RuleEditor(): import("react").FunctionComponent<Readonly<import("./RuleEditor").Props>>;
    get rule_editor_props(): Readonly<import("./RuleEditor").Props>;
    get show_main(): boolean;
    get show_data(): boolean;
    get show_data_data_engine(): boolean;
    get show_data_data_indexed(): boolean;
    get rl_indexed_note_count(): number;
    get rl_indexed_note_active(): number;
    get show_can_write(): boolean;
    get part1_props(): {
        rows: Rule[];
        columns: DataTableColumn<Rule>[];
        isLoading: boolean;
        isError: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./types").RulesListResponse>, Error>>;
        anyFilter: boolean;
        setQ: (value: RulesSection["q"] | ((prev: RulesSection["q"]) => RulesSection["q"])) => void;
        setModeFilter: (value: RulesSection["modeFilter"] | ((prev: RulesSection["modeFilter"]) => RulesSection["modeFilter"])) => void;
        setModuleFilter: (value: RulesSection["moduleFilter"] | ((prev: RulesSection["moduleFilter"]) => RulesSection["moduleFilter"])) => void;
        toolbar: import("react").JSX.Element;
        rowActions: DataTableRowAction<Rule>[];
        navigate: import("react-router").NavigateFunction;
        canWrite: boolean;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, onRetry, filtered, onClearFilters, toolbar, rowActions, onRowClick, configurableColumns, t, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof import("../../../ui/ConfirmDialog").default;
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
    armSimulation(id: string): void;
    toggleMode(rule: Rule): void;
    duplicate(rule: Rule): void;
    askDelete(rule: Rule): Promise<void>;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setModeFilter` of the TSX: a value, or an update of the previous one. */
    setModeFilter(value: RulesSection['modeFilter'] | ((prev: RulesSection['modeFilter']) => RulesSection['modeFilter'])): void;
    /** `setModuleFilter` of the TSX: a value, or an update of the previous one. */
    setModuleFilter(value: RulesSection['moduleFilter'] | ((prev: RulesSection['moduleFilter']) => RulesSection['moduleFilter'])): void;
    /** `setQ` of the TSX: a value, or an update of the previous one. */
    setQ(value: RulesSection['q'] | ((prev: RulesSection['q']) => RulesSection['q'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RulesSectionStores = ReturnType<RulesSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type RulesSectionHooks = ReturnType<RulesSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
