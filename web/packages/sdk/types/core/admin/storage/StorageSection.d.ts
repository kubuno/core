/**
 * Code-behind of `StorageSection.kbview` (converted from `StorageSection.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import type { AdminSectionProps } from "../sections/registry";
import { type Segment } from "./charts";
import { TrendChart } from "./TrendChart";
import { ViewBase } from './StorageSection.kbview';
import * as __parts from './StorageSection.parts';
export type { AdminSectionProps };
export declare class StorageSection extends ViewBase {
    accessor warnDraft: number | null;
    accessor error: string | null;
    tr: StorageSectionStores['t'];
    can: StorageSectionStores['can'];
    data: StorageSectionStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: StorageSectionStores['refetch'];
    setWarn: StorageSectionStores['setWarn'];
    trendData: {
        day: string;
        value: number;
    }[];
    projection: {
        perDay: number;
        daysLeft: number | null;
    } | null;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../authz/types").CanFn;
        data: NoInfer<import("./api").StorageOverview> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").StorageOverview>, Error>>;
        setWarn: import("@tanstack/react-query").UseMutationResult<unknown, Error, number, unknown>;
        trendData: {
            day: string;
            value: number;
        }[];
        projection: {
            perDay: number;
            daysLeft: number | null;
        } | null;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManageSettings(): boolean;
    get volume(): import("./api").StorageVolume | null;
    get states(): {
        ok: number;
        near: number;
        full: number;
    };
    get volumeFreeRatio(): number | null;
    get otherOnVolume(): number;
    get volumeSegments(): Segment[];
    get stateSegments(): Segment[];
    get overCommitted(): boolean;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    get show_volume_free_ratio_volume_free_ratio(): boolean;
    get variant(): "danger" | "warning";
    get sto_banner_volume_title_percent(): number;
    get span_text(): string;
    get show_volume(): boolean;
    get sto_of_volume_total(): string;
    get show_not_volume(): boolean;
    /** `<CompositionBar>`, rendered by a ReactHost. */
    get CompositionBar(): import("react").FunctionComponent<Readonly<import("./CompositionBar").CompositionBarProps>>;
    get composition_bar_props(): {
        segments: Segment[];
        total: number;
        ariaLabel: string;
    };
    get p_text(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        data: NoInfer<import("./api").StorageOverview>;
    };
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part2(): typeof __parts.Part2;
    get sto_overcommit_allocated(): string;
    get sto_overcommit_total(): string;
    get sto_states_sub_percent(): number;
    /** `<CompositionBar>`, rendered by a ReactHost. */
    get CompositionBar2(): import("react").FunctionComponent<Readonly<import("./CompositionBar").CompositionBarProps>>;
    get composition_bar_props2(): Readonly<import("./CompositionBar").CompositionBarProps>;
    get show_states_full_states(): boolean;
    get show_not_states_full_states(): boolean;
    get show_trend_data(): boolean;
    get show_not_trend_data(): boolean;
    /** `<TrendChart>`, rendered by a ReactHost. */
    get TrendChart(): typeof TrendChart;
    get trend_chart_props(): {
        data: {
            day: string;
            value: number;
        }[];
        label: string;
    };
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        trendData: {
            day: string;
            value: number;
        }[];
    };
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part4(): typeof __parts.Part4;
    get show_projection(): boolean;
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        projection: {
            perDay: number;
            daysLeft: number | null;
        };
        projection_daysLeft: number | null;
    };
    /** A part of the screen still written in React (<Figure> is no .kbview element (./Figure#default)). */
    get Part5(): typeof __parts.Part5;
    get show_projection_days_left(): boolean;
    get visible(): boolean;
    get sto_trend_empty_desc_count(): number;
    get show_data_by_module(): boolean;
    /** `<ModuleBreakdownCard>`, rendered by a ReactHost. */
    get ModuleBreakdownCard(): import("react").FunctionComponent<Readonly<import("./ModuleBreakdownCard").ModuleBreakdownCardProps>>;
    get module_breakdown_card_props(): {
        data: import("./api").ModuleBreakdown;
    };
    get show_data_reconciliation(): boolean;
    /** `<ReconciliationCard>`, rendered by a ReactHost. */
    get ReconciliationCard(): import("react").FunctionComponent<Readonly<import("./ReconciliationCard").ReconciliationCardProps>>;
    get reconciliation_card_props(): {
        data: import("./api").Reconciliation;
        modules: import("./api").ModuleUsage[];
        staleHours: number;
    };
    /** `<ConsumersCard>`, rendered by a ReactHost. */
    get ConsumersCard(): import("react").FunctionComponent<Readonly<import("./ConsumersCard").ConsumersCardProps>>;
    get consumers_card_props(): {
        warnPercent: number;
        initialFilter: string;
    };
    get show_data_by_unit(): boolean;
    get show_not_data_by_unit(): boolean;
    /** A part of the screen still written in React (<ProgressBar> label: an object value for a text property). */
    get Part6(): typeof __parts.Part6;
    /** The rows of the Repeater over `data.by_unit`. */
    get rows_by_unit(): {
        u: import("./api").UnitUsage;
        part6_props: {
            u: import("./api").UnitUsage;
            data: NoInfer<import("./api").StorageOverview>;
            t: import("i18next").TFunction<"translation", undefined>;
        } | undefined;
        key: string;
    }[];
    /** `<QuotaPolicyCard>`, rendered by a ReactHost. */
    get QuotaPolicyCard(): import("react").FunctionComponent<Readonly<import("./QuotaPolicyCard").QuotaPolicyCardProps>>;
    get quota_policy_card_props(): {
        overview: NoInfer<import("./api").StorageOverview>;
    };
    get part7_props(): {
        canManageSettings: boolean;
        warnDraft: number | null;
        data: NoInfer<import("./api").StorageOverview>;
        setWarnDraft: (value: number | null | ((prev: number | null) => number | null)) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<input> has no .kbview element yet). */
    get Part7(): typeof __parts.Part7;
    get span_text2(): string;
    get show_can_manage_settings_warn_draft_warn_draft(): boolean;
    get enabled_unless_set_warn_is_pending(): boolean;
    get show_error(): boolean;
    saveWarn(percent: number): Promise<undefined>;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
    callout_action(_sender: unknown, _args: EventArgs): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setWarnDraft` of the TSX: a value, or an update of the previous one. */
    setWarnDraft(value: number | null | ((prev: number | null) => number | null)): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type StorageSectionStores = ReturnType<StorageSection['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
