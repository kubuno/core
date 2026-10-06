import { type ComboboxOption, type DataTableColumn } from "@ui";
import type { AdminSectionProps } from "../sections/registry";
import { type DeviceSession, type SessionFilters } from "../../devices/types";
import { ViewBase } from './NetworksSection.kbview';
import * as __parts from './NetworksSection.parts';
export type { AdminSectionProps };
export declare class NetworksSection extends ViewBase {
    tr: NetworksSectionStores['t'];
    i18n: NetworksSectionStores['i18n'];
    toast: NetworksSectionStores['toast'];
    filters: SessionFilters;
    setFilters: NetworksSectionHooks['setFilters'];
    draft: NetworksSectionHooks['draft'];
    setDraft: NetworksSectionHooks['setDraft'];
    data: NetworksSectionHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: NetworksSectionHooks['refetch'];
    origins: [string, number][];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        toast: import("@ui").ToastApi;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        filters: SessionFilters;
        setFilters: import("react").Dispatch<import("react").SetStateAction<SessionFilters>>;
        draft: string;
        setDraft: import("react").Dispatch<import("react").SetStateAction<string>>;
        data: NoInfer<{
            sessions: import("../../devices/types").DeviceSession[];
            total: number;
        }> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<{
            sessions: import("../../devices/types").DeviceSession[];
            total: number;
        }>, Error>>;
        origins: [string, number][];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get rows(): DeviceSession[];
    get anyFilter(): boolean;
    get clients(): ComboboxOption[];
    get twoFactor(): ComboboxOption[];
    get columns(): DataTableColumn<DeviceSession>[];
    get toolbar(): import("react").JSX.Element;
    get show_data(): boolean;
    get sessions_count_count(): number;
    get show_origins(): boolean;
    get part1_props(): {
        origins: [string, number][];
        set: <K extends keyof SessionFilters>(key: K, value: SessionFilters[K]) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (a list callback destructuring its item). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        rows: DeviceSession[];
        columns: DataTableColumn<DeviceSession>[];
        isLoading: boolean;
        isError: boolean;
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<{
            sessions: import("../../devices/types").DeviceSession[];
            total: number;
        }>, Error>>;
        anyFilter: boolean;
        setFilters: import("react").Dispatch<import("react").SetStateAction<SessionFilters>>;
        setDraft: import("react").Dispatch<import("react").SetStateAction<string>>;
        toolbar: import("react").JSX.Element;
        toast: import("@ui").ToastApi;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, onRetry, filtered, onClearFilters, toolbar, configurableColumns, t, emptyState: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    set<K extends keyof SessionFilters>(key: K, value: SessionFilters[K]): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type NetworksSectionStores = ReturnType<NetworksSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type NetworksSectionHooks = ReturnType<NetworksSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
