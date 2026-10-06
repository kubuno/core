/**
 * Code-behind of `SecurityDashboardSection.kbview` (converted from `SecurityDashboardSection.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { AdminSectionProps } from "../sections/registry";
import { ViewBase } from './SecurityDashboardSection.kbview';
import * as __parts from './SecurityDashboardSection.parts';
export type { AdminSectionProps };
export declare class SecurityDashboardSection extends ViewBase {
    accessor period: string;
    accessor editing: boolean;
    tr: SecurityDashboardSectionStores['t'];
    can: SecurityDashboardSectionStores['can'];
    data: SecurityDashboardSectionHooks['data'];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    layout: SecurityDashboardSectionStores['layout'];
    hide: (id: string, visible: string[]) => void;
    show: (id: string, visible: string[]) => void;
    move: (id: string, delta: -1 | 1, visible: string[]) => void;
    reset: () => void;
    received: SecurityDashboardSectionHooks['received'];
    visible: string[];
    hiddenAvailable: string[];
    periodOptions: {
        value: string;
        label: string;
    }[];
    openReport: (id: string) => void;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        can: import("../../authz/types").CanFn;
        layout: import("./usePanelLayout").PanelLayout;
        hide: (id: string, visible: string[]) => void;
        show: (id: string, visible: string[]) => void;
        move: (id: string, delta: -1 | 1, visible: string[]) => void;
        reset: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<import("./api").SecurityDashboard> | undefined;
        isLoading: boolean;
        isError: boolean;
        error: Error | null;
        received: Map<string, import("../panels/types").DashboardPanel>;
        visible: string[];
        hiddenAvailable: string[];
        periodOptions: {
            value: string;
            label: string;
        }[];
        openReport: (id: string) => void;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get bucket(): import("../panels/types").PanelBucket;
    get withheldCount(): number;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get part1_props(): {
        period: string;
        setPeriod: (value: SecurityDashboardSection["period"] | ((prev: SecurityDashboardSection["period"]) => SecurityDashboardSection["period"])) => void;
        periodOptions: {
            value: string;
            label: string;
        }[];
    };
    /** A part of the screen still written in React (<Dropdown> width, focusable: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        editing: boolean;
        setEditing: (value: SecurityDashboardSection["editing"] | ((prev: SecurityDashboardSection["editing"]) => SecurityDashboardSection["editing"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button Icon>: an icon that is not a Lucide icon). */
    get Part2(): typeof __parts.Part2;
    get callout_text(): string;
    get show_data(): boolean;
    /** `<RetentionNotice>`, rendered by a ReactHost. */
    get RetentionNotice(): typeof __parts.RetentionNotice;
    get retention_notice_props(): {
        periodId: string;
        retention: import("./api").SecurityRetention;
    };
    get show_data_visible(): boolean;
    get part3_props(): {
        visible: string[];
        received: Map<string, import("../panels/types").DashboardPanel>;
        bucket: import("../panels/types").PanelBucket;
        editing: boolean;
        hide: (id: string, visible: string[]) => void;
        move: (id: string, delta: -1 | 1, visible: string[]) => void;
        openReport: (id: string) => void;
    };
    /** A part of the screen still written in React (a list whose item is not a single element). */
    get Part3(): typeof __parts.Part3;
    get show_data_visible2(): boolean;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        reset: () => void;
    };
    /** A part of the screen still written in React (<EmptyState> action.variant: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    get show_editing_data(): boolean;
    get show_hidden_available(): boolean;
    get show_not_hidden_available(): boolean;
    get part5_props(): {
        hiddenAvailable: string[];
        show: (id: string, visible: string[]) => void;
        visible: string[];
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (a list whose item is not a single element). */
    get Part5(): typeof __parts.Part5;
    get show_withheld_count(): boolean;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setPeriod` of the TSX: a value, or an update of the previous one. */
    setPeriod(value: SecurityDashboardSection['period'] | ((prev: SecurityDashboardSection['period']) => SecurityDashboardSection['period'])): void;
    /** `setEditing` of the TSX: a value, or an update of the previous one. */
    setEditing(value: SecurityDashboardSection['editing'] | ((prev: SecurityDashboardSection['editing']) => SecurityDashboardSection['editing'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SecurityDashboardSectionStores = ReturnType<SecurityDashboardSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type SecurityDashboardSectionHooks = ReturnType<SecurityDashboardSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
