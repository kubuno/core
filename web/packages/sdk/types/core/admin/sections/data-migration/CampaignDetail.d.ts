import { type DataTableColumn } from "@ui";
import ConfirmDialog from "@ui/ConfirmDialog";
import { type MigrationAccount } from "./api";
import { ViewBase } from './CampaignDetail.kbview';
import * as __parts from './CampaignDetail.parts';
export type CampaignDetailProps = {
    campaignId: string;
    canManage: boolean;
    /** Called after a removal, so the page can return to the list. */
    onGone: () => void;
};
export declare class CampaignDetail extends ViewBase {
    tr: CampaignDetailStores['t'];
    toast: CampaignDetailStores['toast'];
    confirm: CampaignDetailStores['confirm'];
    confirmState: CampaignDetailStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    data: CampaignDetailHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: CampaignDetailHooks['refetch'];
    start: CampaignDetailStores['start'];
    pause: CampaignDetailStores['pause'];
    retry: CampaignDetailStores['retry'];
    remove: CampaignDetailStores['remove'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        start: import("@tanstack/react-query").UseMutationResult<import("./api").Campaign, Error, string, unknown>;
        pause: import("@tanstack/react-query").UseMutationResult<import("./api").Campaign, Error, string, unknown>;
        retry: import("@tanstack/react-query").UseMutationResult<MigrationAccount[], Error, {
            id: string;
            accountId: string;
        }, unknown>;
        remove: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<import("./api").CampaignDetailPayload> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").CampaignDetailPayload>, Error>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get campaign(): import("./api").Campaign | undefined;
    get accounts(): MigrationAccount[];
    get tally(): import("./api").CampaignTally;
    get progress(): number;
    get columns(): DataTableColumn<MigrationAccount>[];
    get show_case_1(): boolean;
    get p_text(): string;
    get show_main(): boolean;
    get h1_text(): string;
    get migr_detail_sub_service(): string;
    get migr_detail_sub_host(): string;
    get show_campaign_status_running(): boolean;
    get show_not_campaign_status_running(): boolean;
    get part1_props(): {
        pause: import("@tanstack/react-query").UseMutationResult<import("./api").Campaign, Error, string, unknown>;
        campaignId: string;
        toast: import("@ui").ToastApi;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        start: import("@tanstack/react-query").UseMutationResult<import("./api").Campaign, Error, string, unknown>;
        campaignId: string;
        toast: import("@ui").ToastApi;
        t: import("i18next").TFunction<"translation", undefined>;
        campaign: import("./api").Campaign;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        t: import("i18next").TFunction<"translation", undefined>;
        campaign: import("./api").Campaign;
        remove: import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
        campaignId: string;
        toast: import("@ui").ToastApi;
        onGone: () => void;
    };
    /** A part of the screen still written in React (<Button> with element children). */
    get Part3(): typeof __parts.Part3;
    get show_campaign_error(): boolean;
    get callout_text(): string;
    get variant(): "primary" | "neutral";
    get badge_text(): string;
    get show_campaign_since_date(): boolean;
    get migr_since_summary_date(): string;
    get show_campaign_exclude_folders(): boolean;
    get migr_excluded_summary_folders(): string;
    get span_text(): string;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        accounts: MigrationAccount[];
        columns: DataTableColumn<MigrationAccount>[];
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").CampaignDetailPayload>, Error>>;
    };
    /** A part of the screen still written in React (<DataTable> t, columns, rowKey, onRetry: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof ConfirmDialog;
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
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CampaignDetailStores = ReturnType<CampaignDetail['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type CampaignDetailHooks = ReturnType<CampaignDetail['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<CampaignDetailProps>>;
export default _default;
