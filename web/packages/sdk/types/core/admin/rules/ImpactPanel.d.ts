/**
 * Code-behind of `ImpactPanel.kbview` (converted from `ImpactPanel.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type BacktestRow } from "./types";
import { ViewBase } from './ImpactPanel.kbview';
import * as __parts from './ImpactPanel.parts';
interface Props {
    ruleId: string | null;
    /** The last replays already stored for this rule, newest first. */
    previous: BacktestRow[];
    /** No rule id yet (the wizard): the panel explains instead of offering. */
    hint?: string;
}
export type { Props };
export declare class ImpactPanel extends ViewBase {
    accessor days: number;
    accessor runId: string | null;
    tr: ImpactPanelStores['t'];
    i18n: ImpactPanelStores['i18n'];
    start: ImpactPanelStores['start'];
    poll: ImpactPanelHooks['poll'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        start: import("@tanstack/react-query").UseMutationResult<BacktestRow, Error, {
            id: string;
            from?: string;
            to?: string;
        }, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        poll: import("@tanstack/react-query").UseQueryResult<NoInfer<BacktestRow>, Error>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get row(): BacktestRow | null;
    get report(): import("./types").BacktestReport;
    get running(): boolean;
    get scanned(): number;
    get matched(): number;
    get ratio(): number;
    get show_case_1(): boolean;
    get callout_text(): string;
    get show_main(): boolean;
    /** The rows of the Repeater over `WINDOWS`. */
    get rows_windows(): {
        d: number;
        variant: string | undefined;
        key: number;
    }[];
    get rl_impact_retention_days(): number;
    get callout_text2(): string;
    get show_row_running(): boolean;
    get show_row_status_failed(): boolean;
    get callout_text3(): string;
    get show_row_status_done(): boolean;
    get rl_impact_window_from(): string;
    get rl_impact_window_to(): string;
    /** `<Figure>`, rendered by a ReactHost. */
    get Figure(): typeof __parts.Figure;
    get figure_props(): {
        label: string;
        value: number;
    };
    get figure_props2(): {
        label: string;
        value: number;
    };
    get figure_props3(): {
        label: string;
        value: number;
        hint: string;
    };
    get figure_props4(): {
        label: string;
        value: number;
        hint: string;
    };
    get part1_props(): {
        ratio: number;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<ProgressBar> formatValue: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_report_by_org(): boolean;
    /** The rows of the Repeater over `(report.by_org_unit ?? []).slice(0, 8)`. */
    get rows_items(): {
        u: {
            unit: string;
            count: number;
        };
        key: string;
    }[];
    get show_report_by_day(): boolean;
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part2(): typeof __parts.Part2;
    /** The rows of the Repeater over `(report.by_day ?? [])`. */
    get rows_items2(): {
        d: {
            day: string;
            count: number;
        };
        peak: number;
        tooltip: string | undefined;
        part2_props: {
            d: {
                day: string;
                count: number;
            };
            peak: number;
        } | undefined;
        span_text: string | undefined;
        key: string;
    }[];
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        report: import("./types").BacktestReport;
    };
    /** A part of the screen still written in React (<Callout> icon: a value the property converts (null-when-false)). */
    get Part3(): typeof __parts.Part3;
    get show_row_running_start(): boolean;
    launch(): void;
    button_click(_sender: unknown, args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ImpactPanelStores = ReturnType<ImpactPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ImpactPanelHooks = ReturnType<ImpactPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
