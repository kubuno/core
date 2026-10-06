/**
 * Code-behind of `OverviewTab.kbview` (converted from `OverviewTab.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import type { ResourcePane } from "./panes";
import { ViewBase } from './OverviewTab.kbview';
import * as __parts from './OverviewTab.parts';
export type OverviewTabProps = {
    onGo: (pane: ResourcePane) => void;
};
export declare class OverviewTab extends ViewBase {
    tr: OverviewTabStores['t'];
    data: OverviewTabStores['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: OverviewTabStores['refetch'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        data: NoInfer<import("./api").ResourceOverview> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").ResourceOverview>, Error>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get allGaps(): {
        key: string;
        count: number;
        text: string;
        pane: ResourcePane;
    }[];
    get gaps(): {
        key: string;
        count: number;
        text: string;
        pane: ResourcePane;
    }[];
    get isEmpty(): boolean;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    /** `<Stat>`, rendered by a ReactHost. */
    get Stat(): typeof __parts.Stat;
    get stat_props(): {
        icon: import("react").JSX.Element;
        value: number;
        label: string;
    };
    get stat_props2(): {
        icon: import("react").JSX.Element;
        value: number;
        label: string;
    };
    get stat_props3(): {
        icon: import("react").JSX.Element;
        value: number;
        label: string;
    };
    get stat_props4(): {
        icon: import("react").JSX.Element;
        value: number;
        label: string;
    };
    get show_is_empty(): boolean;
    get show_gaps(): boolean;
    get show_not_gaps(): boolean;
    /** The rows of the Repeater over `gaps`. */
    get rows_gaps(): {
        g: {
            key: string;
            count: number;
            text: string;
            pane: ResourcePane;
        };
        key: string;
    }[];
    callout_action(_sender: unknown, _args: EventArgs): undefined;
    button_click(_sender: unknown, args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type OverviewTabStores = ReturnType<OverviewTab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<OverviewTabProps>>;
export default _default;
