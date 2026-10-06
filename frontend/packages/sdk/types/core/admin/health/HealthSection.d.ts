/**
 * Code-behind of `HealthSection.kbview` (converted from `HealthSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { type AccordionItemDef } from "@ui";
import { type HealthCheck } from "./types";
import { ViewBase } from './HealthSection.kbview';
import * as __parts from './HealthSection.parts';
export declare class HealthSection extends ViewBase {
    accessor open: string[] | null;
    tr: HealthSectionStores['t'];
    i18n: HealthSectionStores['i18n'];
    can: HealthSectionStores['can'];
    toast: HealthSectionStores['toast'];
    data: HealthSectionStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: HealthSectionStores['refetch'];
    refresh: HealthSectionStores['refresh'];
    byBlock: Map<string, HealthCheck[]>;
    defaultOpen: HealthSectionStores['defaultOpen'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        can: import("../../authz/types").CanFn;
        toast: import("@ui").ToastApi;
        data: NoInfer<import("./types").HealthReport> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./types").HealthReport>, Error>>;
        refresh: import("@tanstack/react-query").UseMutationResult<import("./types").HealthReport, Error, void, unknown>;
        byBlock: Map<string, HealthCheck[]>;
        defaultOpen: import("./types").HealthBlock[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get counts(): import("./types").HealthCounts;
    get score(): number | null;
    get scoreable(): number;
    get items(): AccordionItemDef[];
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_case_3(): boolean;
    get show_main(): boolean;
    get hc_generated_when(): string;
    get show_score(): boolean;
    get variant(): "danger" | "success" | "warning";
    get p_text(): string;
    get show_counts_critical(): boolean;
    get part1_props(): {
        items: AccordionItemDef[];
        open: string[] | null;
        defaultOpen: import("./types").HealthBlock[];
        setOpen: (value: string[] | null | ((prev: string[] | null) => string[] | null)) => void;
    };
    /** A part of the screen still written in React (<Accordion> items, open, onOpenChange: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    onRefreshAll(): void;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
    /** `setOpen` of the TSX: a value, or an update of the previous one. */
    setOpen(value: string[] | null | ((prev: string[] | null) => string[] | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type HealthSectionStores = ReturnType<HealthSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
