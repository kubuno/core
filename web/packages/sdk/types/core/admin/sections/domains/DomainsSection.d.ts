import { type DataTableColumn, type DataTableRowAction } from "@ui";
import type { AdminSectionProps } from "../registry";
import { type Domain } from "./api";
import { ViewBase } from './DomainsSection.kbview';
import * as __parts from './DomainsSection.parts';
export type { AdminSectionProps };
export declare class DomainsSection extends ViewBase {
    accessor adding: boolean;
    accessor error: string | null;
    tr: DomainsSectionStores['t'];
    can: DomainsSectionStores['can'];
    routerNavigate: DomainsSectionStores['routerNavigate'];
    data: DomainsSectionStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: DomainsSectionStores['refetch'];
    verify: DomainsSectionStores['verify'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../../authz/types").CanFn;
        routerNavigate: import("react-router").NavigateFunction;
        data: NoInfer<import("./api").DomainsPayload> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").DomainsPayload>, Error>>;
        verify: import("@tanstack/react-query").UseMutationResult<Domain, Error, string, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get selected(): string | null;
    get domains(): Domain[];
    get overview(): {
        total: number;
        verified: number;
        pending: number;
        aliases: number;
        primary_name: string | null;
    } | undefined;
    get columns(): DataTableColumn<Domain>[];
    get rowActions(): DataTableRowAction<Domain>[];
    get fromMismatch(): boolean | "" | null | undefined;
    get show_case_1(): boolean;
    /** `<DomainDetail>`, rendered by a ReactHost. */
    get DomainDetail(): import("react").FunctionComponent<Readonly<import("./DomainDetail").DomainDetailProps>>;
    get domain_detail_props(): Readonly<import("./DomainDetail").DomainDetailProps>;
    get show_main(): boolean;
    get show_overview(): boolean;
    /** `<Figure>`, rendered by a ReactHost. */
    get Figure(): typeof __parts.Figure;
    get figure_props(): {
        value: number;
        label: string;
    };
    get figure_props2(): {
        value: number;
        label: string;
    };
    get figure_props3(): {
        value: number;
        label: string;
    };
    get show_overview_primary_name(): boolean;
    get dom_primary_is_name(): string;
    get part1_props(): {
        setAdding: (value: DomainsSection["adding"] | ((prev: DomainsSection["adding"]) => DomainsSection["adding"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part1(): typeof __parts.Part1;
    get show_from_mismatch(): boolean;
    get dom_from_mismatch_address(): string | null | undefined;
    get dom_from_mismatch_domain(): string | null | undefined;
    get show_error(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        domains: Domain[];
        columns: DataTableColumn<Domain>[];
        isLoading: boolean;
        rowActions: DataTableRowAction<Domain>[];
        open: (id: string | null) => void | Promise<void>;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").DomainsPayload>, Error>>;
        canManage: boolean;
        setAdding: (value: DomainsSection["adding"] | ((prev: DomainsSection["adding"]) => DomainsSection["adding"])) => void;
    };
    /** A part of the screen still written in React (<DataTable> t, columns, rowKey, rowActions, onRowClick, onRetry, emptyState: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    /** `<AddDomainDialog>`, rendered by a ReactHost. */
    get AddDomainDialog(): import("react").FunctionComponent<Readonly<import("./AddDomainDialog").AddDomainDialogProps>>;
    get add_domain_dialog_props(): Readonly<import("./AddDomainDialog").AddDomainDialogProps>;
    open(id: string | null): void | Promise<void>;
    /** `setAdding` of the TSX: a value, or an update of the previous one. */
    setAdding(value: DomainsSection['adding'] | ((prev: DomainsSection['adding']) => DomainsSection['adding'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DomainsSectionStores = ReturnType<DomainsSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
