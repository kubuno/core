import { type DataTableColumn, type DataTableRowAction } from "@ui";
import type { AdminSectionProps } from "../registry";
import { type Campaign } from "./api";
import { ViewBase } from './DataMigrationSection.kbview';
import * as __parts from './DataMigrationSection.parts';
export type { AdminSectionProps };
export declare class DataMigrationSection extends ViewBase {
    accessor composing: boolean;
    tr: DataMigrationSectionStores['t'];
    can: DataMigrationSectionStores['can'];
    data: DataMigrationSectionStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: DataMigrationSectionStores['refetch'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../../authz/types").CanFn;
        data: NoInfer<import("./api").CampaignsPayload> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").CampaignsPayload>, Error>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get selected(): string | null;
    get campaigns(): Campaign[];
    get services(): import("./api").MigrationService[];
    get noService(): boolean;
    get columns(): DataTableColumn<Campaign>[];
    get rowActions(): DataTableRowAction<Campaign>[];
    get show_case_1(): boolean;
    /** `<CampaignDetail>`, rendered by a ReactHost. */
    get CampaignDetail(): import("react").FunctionComponent<Readonly<import("./CampaignDetail").CampaignDetailProps>>;
    get campaign_detail_props(): Readonly<import("./CampaignDetail").CampaignDetailProps>;
    get show_main(): boolean;
    get part1_props(): {
        noService: boolean;
        setComposing: (value: DataMigrationSection["composing"] | ((prev: DataMigrationSection["composing"]) => DataMigrationSection["composing"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        campaigns: Campaign[];
        columns: DataTableColumn<Campaign>[];
        isLoading: boolean;
        rowActions: DataTableRowAction<Campaign>[];
        open: (id: string | null) => void | Promise<void>;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").CampaignsPayload>, Error>>;
        canManage: boolean;
        noService: boolean;
        setComposing: (value: DataMigrationSection["composing"] | ((prev: DataMigrationSection["composing"]) => DataMigrationSection["composing"])) => void;
    };
    /** A part of the screen still written in React (<DataTable> t, columns, rowKey, rowActions, onRowClick, onRetry, emptyState: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    /** `<CampaignWizard>`, rendered by a ReactHost. */
    get CampaignWizard(): import("react").FunctionComponent<Readonly<import("./CampaignWizard").CampaignWizardProps>>;
    get campaign_wizard_props(): Readonly<import("./CampaignWizard").CampaignWizardProps>;
    open(id: string | null): void | Promise<void>;
    /** `setComposing` of the TSX: a value, or an update of the previous one. */
    setComposing(value: DataMigrationSection['composing'] | ((prev: DataMigrationSection['composing']) => DataMigrationSection['composing'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DataMigrationSectionStores = ReturnType<DataMigrationSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
