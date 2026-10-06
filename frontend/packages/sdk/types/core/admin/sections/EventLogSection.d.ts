/**
 * Code-behind of `EventLogSection.kbview` (converted from `EventLogSection.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type ComboboxOption, type DataTableColumn } from "@ui";
import { ViewBase } from './EventLogSection.kbview';
import * as __parts from './EventLogSection.parts';
interface EventRow {
    id: number;
    event_type: string;
    source_module: string | null;
    payload: Record<string, unknown>;
    created_at: string;
}
interface EventPage {
    events: EventRow[];
    limit: number;
    offset: number;
}
export declare class EventLogSection extends ViewBase {
    accessor type: string;
    accessor open: number | null;
    tr: EventLogSectionStores['t'];
    i18n: EventLogSectionStores['i18n'];
    fetchNextPage: EventLogSectionHooks['fetchNextPage'];
    hasNextPage: boolean;
    isFetching: boolean;
    isLoading: boolean;
    isError: boolean;
    refetch: EventLogSectionHooks['refetch'];
    rows: EventRow[];
    typeOptions: ComboboxOption[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: import("@tanstack/query-core").InfiniteData<EventPage, unknown> | undefined;
        fetchNextPage: (options?: import("@tanstack/query-core").FetchNextPageOptions) => Promise<import("@tanstack/query-core").InfiniteQueryObserverResult<import("@tanstack/query-core").InfiniteData<EventPage, unknown>, Error>>;
        hasNextPage: boolean;
        isFetching: boolean;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<import("@tanstack/query-core").InfiniteData<EventPage, unknown>, Error>>;
        rows: EventRow[];
        typeOptions: ComboboxOption[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get columns(): DataTableColumn<EventRow>[];
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        type: string;
        setType: (value: EventLogSection["type"] | ((prev: EventLogSection["type"]) => EventLogSection["type"])) => void;
        typeOptions: ComboboxOption[];
    };
    /** A part of the screen still written in React (<ComboBox> width, searchPlaceholder: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        rows: EventRow[];
        columns: DataTableColumn<EventRow>[];
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<import("@tanstack/query-core").InfiniteData<EventPage, unknown>, Error>>;
        type: string;
        setType: (value: EventLogSection["type"] | ((prev: EventLogSection["type"]) => EventLogSection["type"])) => void;
    };
    /** A part of the screen still written in React (<DataTable> t, columns, rowKey, skeletonRows, onRetry, filtered, onClearFilters, manualSort, configurableColumns, minTableWidth, emptyState: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get enabled_unless_is_fetching(): boolean;
    get button_text(): string;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setType` of the TSX: a value, or an update of the previous one. */
    setType(value: EventLogSection['type'] | ((prev: EventLogSection['type']) => EventLogSection['type'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type EventLogSectionStores = ReturnType<EventLogSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type EventLogSectionHooks = ReturnType<EventLogSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
