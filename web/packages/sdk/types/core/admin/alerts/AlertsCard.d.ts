/**
 * Code-behind of `AlertsCard.kbview` (converted from `AlertsCard.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { useNavigate } from 'react-router-dom';
import { ViewBase } from './AlertsCard.kbview';
import * as __parts from './AlertsCard.parts';
export declare class AlertsCard extends ViewBase {
    tr: AlertsCardStores['t'];
    i18n: AlertsCardStores['i18n'];
    summary: AlertsCardStores['summary'];
    data: AlertsCardStores['data'];
    isLoading: boolean;
    navigate: ReturnType<typeof useNavigate>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        summary: NoInfer<import("./types").AlertSummary> | undefined;
        data: import("@tanstack/query-core").InfiniteData<import("./useAlerts").AlertPage, unknown> | undefined;
        isLoading: boolean;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get top(): import("./types").Alert[];
    get show_summary_summary_open(): boolean;
    get span_text(): number;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Link style>). */
    get Part1(): typeof __parts.Part1;
    get show_not_is_loading(): boolean;
    get show_top(): boolean;
    get show_not_top(): boolean;
    get p_text(): string;
    /** The rows of the Repeater over `top`. */
    get rows_top(): {
        a: import("./types").Alert;
        skin: {
            dot: string;
            chip: string;
        };
        href: string | undefined;
        span_class: string | undefined;
        span_text: string | undefined;
        span_text2: string | undefined;
        key: string;
    }[];
    get show_summary_summary_open2(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        summary: NoInfer<import("./types").AlertSummary>;
        top: import("./types").Alert[];
    };
    /** A part of the screen still written in React (<Link style>). */
    get Part2(): typeof __parts.Part2;
    get visible(): boolean;
    get visible2(): boolean;
    panel_click(_sender: unknown, args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AlertsCardStores = ReturnType<AlertsCard['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
