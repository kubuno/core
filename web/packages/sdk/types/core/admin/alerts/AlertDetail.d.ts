/**
 * Code-behind of `AlertDetail.kbview` (converted from `AlertDetail.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type ComboboxOption } from "@ui";
import { type AlertStatus } from "./types";
import { ViewBase } from './AlertDetail.kbview';
import * as __parts from './AlertDetail.parts';
export type AlertDetailProps = {
    id: string;
    onBack: () => void;
};
export declare class AlertDetail extends ViewBase {
    accessor draft: string;
    tr: AlertDetailStores['t'];
    i18n: AlertDetailStores['i18n'];
    can: AlertDetailStores['can'];
    toast: AlertDetailStores['toast'];
    data: AlertDetailHooks['data'];
    isLoading: boolean;
    isError: boolean;
    facets: AlertDetailHooks['facets'];
    setStatus: AlertDetailStores['setStatus'];
    assign: AlertDetailStores['assign'];
    comment: AlertDetailStores['comment'];
    verb: AlertDetailStores['verb'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        can: import("../../authz/types").CanFn;
        toast: import("@ui").ToastApi;
        setStatus: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            status: AlertStatus;
            comment?: string;
        }, unknown>;
        assign: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            assignee_id: string | null;
        }, unknown>;
        comment: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            comment: string;
        }, unknown>;
        verb: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            verb: "retry-jobs" | "discard-jobs";
        }, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<import("./useAlerts").AlertDetail> | undefined;
        isLoading: boolean;
        isError: boolean;
        facets: NoInfer<import("./types").AlertFacets> | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canManage(): boolean;
    get alert(): import("./types").Alert;
    get timeline(): import("./types").AlertEvent[];
    get related(): import("./types").Alert[];
    get skin(): {
        dot: string;
        chip: string;
    };
    get assigneeOptions(): ComboboxOption[];
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get show_main(): boolean;
    get span_class(): string;
    get h1_text(): string;
    get span_class2(): string;
    get span_text(): string;
    get span_text2(): string;
    get p_text(): string;
    /** `<ActionButtons>`, rendered by a ReactHost. */
    get ActionButtons(): typeof __parts.ActionButtons;
    get action_buttons_props(): {
        alert: import("./types").Alert;
        onExecute: (v: "retry-jobs" | "discard-jobs") => void;
        busy: boolean;
    };
    get show_alert_status_acknowledged(): boolean;
    get show_alert_status_resolved(): boolean;
    get show_alert_status_ignored(): boolean;
    get show_is_open_alert_status(): boolean;
    get part1_props(): {
        alert: import("./types").Alert;
        assign: import("@tanstack/react-query").UseMutationResult<unknown, Error, {
            id: string;
            assignee_id: string | null;
        }, unknown>;
        toast: import("@ui").ToastApi;
        t: import("i18next").TFunction<"translation", undefined>;
        assigneeOptions: ComboboxOption[];
    };
    /** A part of the screen still written in React (<ComboBox> searchPlaceholder, emptyLabel, clearable, onClear: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** `<Timeline>`, rendered by a ReactHost. */
    get Timeline(): typeof __parts.Timeline;
    get timeline_props(): {
        events: import("./types").AlertEvent[];
    };
    get part2_props(): {
        draft: string;
        setDraft: (value: AlertDetail["draft"] | ((prev: AlertDetail["draft"]) => AlertDetail["draft"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<TextArea> rows: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get enabled_unless_draft_trim_comment(): boolean;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        alert: import("./types").Alert;
        i18n: import("i18next").i18n;
        alert_module_id: string | null;
        alert_subject_label: string | null;
        alert_assignee_label: string | null;
        alert_closed_at: string | null;
    };
    /** A part of the screen still written in React (<dl> has no .kbview element yet). */
    get Part3(): typeof __parts.Part3;
    get show_related(): boolean;
    /** A part of the screen still written in React (<Link style>). */
    get Part4(): typeof __parts.Part4;
    /** The rows of the Repeater over `related`. */
    get rows_related(): {
        r: import("./types").Alert;
        part4_props: {
            r: import("./types").Alert;
            t: import("i18next").TFunction<"translation", undefined>;
        } | undefined;
        span_text: string | undefined;
        key: string;
    }[];
    move(status: AlertStatus): void;
    runVerb(v: 'retry-jobs' | 'discard-jobs'): void;
    send(): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click2(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click4(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click5(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setDraft` of the TSX: a value, or an update of the previous one. */
    setDraft(value: AlertDetail['draft'] | ((prev: AlertDetail['draft']) => AlertDetail['draft'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AlertDetailStores = ReturnType<AlertDetail['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AlertDetailHooks = ReturnType<AlertDetail['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AlertDetailProps>>;
export default _default;
