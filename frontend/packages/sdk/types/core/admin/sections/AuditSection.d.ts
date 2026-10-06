/**
 * Code-behind of `AuditSection.kbview` (converted from `AuditSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { type DropdownOption } from "@ui";
import { type AuditEntry } from "./auditTypes";
import type { AdminSectionProps } from "./registry";
import { ViewBase } from './AuditSection.kbview';
import * as __parts from './AuditSection.parts';
interface Facets {
    actions: string[];
    target_types: string[];
    actors: {
        id: string;
        label: string;
    }[];
    outcomes: string[];
}
interface Filters {
    q: string;
    action: string;
    target_type: string;
    outcome: string;
    actor_id: string;
    from: string;
    to: string;
}
export type { AdminSectionProps };
export declare class AuditSection extends ViewBase {
    accessor open: number | null;
    tr: AuditSectionStores['t'];
    i18n: AuditSectionStores['i18n'];
    filters: Filters;
    setFilters: AuditSectionHooks['setFilters'];
    draft: AuditSectionHooks['draft'];
    setDraft: AuditSectionHooks['setDraft'];
    facets: AuditSectionStores['facets'];
    retention: AuditSectionStores['retention'];
    data: AuditSectionHooks['data'];
    fetchNextPage: AuditSectionHooks['fetchNextPage'];
    hasNextPage: boolean;
    isFetching: boolean;
    isLoading: boolean;
    rows: AuditEntry[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        facets: NoInfer<Facets> | undefined;
        retention: NoInfer<{
            retention_days: number;
            min_days: number;
            entries: number;
        }> | undefined;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        filters: Filters;
        setFilters: import("react").Dispatch<import("react").SetStateAction<Filters>>;
        draft: string;
        setDraft: import("react").Dispatch<import("react").SetStateAction<string>>;
        data: import("@tanstack/query-core").InfiniteData<{
            entries: AuditEntry[];
            next_cursor: string | null;
        }, unknown> | undefined;
        fetchNextPage: (options?: import("@tanstack/query-core").FetchNextPageOptions) => Promise<import("@tanstack/query-core").InfiniteQueryObserverResult<import("@tanstack/query-core").InfiniteData<{
            entries: AuditEntry[];
            next_cursor: string | null;
        }, unknown>, Error>>;
        hasNextPage: boolean;
        isFetching: boolean;
        isLoading: boolean;
        rows: AuditEntry[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get anyFilter(): boolean;
    get show_retention(): boolean;
    get span_text(): string;
    get part1_props(): {
        exportCsv: () => Promise<void>;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        draft: string;
        setDraft: import("react").Dispatch<import("react").SetStateAction<string>>;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<TextField LeftIcon>: an icon size the element cannot take). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        filters: Filters;
        set: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
        opt: (values: string[], allLabel: string, label?: (v: string) => string) => DropdownOption[];
        facets: NoInfer<Facets> | undefined;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part5(): typeof __parts.Part5;
    get part6_props(): {
        filters: Filters;
        set: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
        t: import("i18next").TFunction<"translation", undefined>;
        facets: NoInfer<Facets> | undefined;
    };
    /** A part of the screen still written in React (<Dropdown> width, height, focusable: no .kbview property). */
    get Part6(): typeof __parts.Part6;
    get part7_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        filters: Filters;
        set: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
    };
    /** A part of the screen still written in React (<input> has no .kbview element yet). */
    get Part7(): typeof __parts.Part7;
    /** A part of the screen still written in React (<input> has no .kbview element yet). */
    get Part8(): typeof __parts.Part8;
    get part9_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        rows: AuditEntry[];
        isLoading: boolean;
        open: number | null;
        setOpen: (value: number | null | ((prev: number | null) => number | null)) => void;
        i18n: import("i18next").i18n;
    };
    /** A part of the screen still written in React (<table> has no .kbview element yet). */
    get Part9(): typeof __parts.Part9;
    get enabled_unless_is_fetching(): boolean;
    get button_text(): string;
    set<K extends keyof Filters>(key: K, value: Filters[K]): void;
    opt(values: string[], allLabel: string, label?: (v: string) => string): DropdownOption[];
    exportHref(): string;
    exportCsv(): Promise<void>;
    panel_submit(_sender: unknown, args: EventArgs): void;
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setOpen` of the TSX: a value, or an update of the previous one. */
    setOpen(value: number | null | ((prev: number | null) => number | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AuditSectionStores = ReturnType<AuditSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AuditSectionHooks = ReturnType<AuditSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
