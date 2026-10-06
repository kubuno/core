/**
 * Code-behind of `RequestStatus.kbview` (converted from `RequestStatus.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { type MyExportOverview, type MyExportRun } from "./api";
import { ViewBase } from './RequestStatus.kbview';
import * as __parts from './RequestStatus.parts';
export interface RequestStatusProps {
    data: MyExportOverview;
    locale: string;
    /** Start a new request: shown once nothing is under way. */
    onRestart: () => void;
}
export declare class RequestStatus extends ViewBase {
    tr: RequestStatusStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get active(): MyExportRun | null;
    get latest(): MyExportRun | undefined;
    get past(): MyExportRun[];
    get show_active(): boolean;
    get value(): number;
    get indeterminate(): boolean;
    get show_latest(): boolean;
    /** `<StatusBadge>`, rendered by a ReactHost. */
    get StatusBadge(): typeof __parts.StatusBadge;
    get status_badge_props(): {
        run: MyExportRun;
    };
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        latest: MyExportRun;
        locale: string;
    };
    /** A part of the screen still written in React (<dl> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
    get show_active2(): boolean;
    get show_active_latest(): boolean;
    get show_past(): boolean;
    /** `<StatusBadge>`, rendered by a ReactHost. */
    get StatusBadge2(): typeof __parts.StatusBadge;
    /** The rows of the Repeater over `past`. */
    get rows_past(): {
        run: MyExportRun;
        span_text: string | undefined;
        status_badge_props: {
            run: MyExportRun;
        } | undefined;
        span_text2: string | undefined;
        key: string;
    }[];
    get show_data_history_status(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Callout> icon: a value the property converts (null-when-false)). */
    get Part2(): typeof __parts.Part2;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RequestStatusStores = ReturnType<RequestStatus['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<RequestStatusProps>>;
export default _default;
