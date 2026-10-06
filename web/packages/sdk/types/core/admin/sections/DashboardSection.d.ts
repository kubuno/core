/**
 * Code-behind of `DashboardSection.kbview` (converted from `DashboardSection.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { Slot } from "../../slots/SlotRegistry";
import type { DashboardPanel } from "../panels/types";
import type { AdminSectionProps } from "./registry";
import { ViewBase } from './DashboardSection.kbview';
import * as __parts from './DashboardSection.parts';
export type { AdminSectionProps };
export declare class DashboardSection extends ViewBase {
    accessor period: string;
    accessor editing: boolean;
    tr: DashboardSectionStores['t'];
    i18n: DashboardSectionStores['i18n'];
    can: DashboardSectionStores['can'];
    stats: DashboardSectionStores['stats'];
    statsLoading: boolean;
    data: DashboardSectionHooks['data'];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    layout: DashboardSectionStores['layout'];
    hide: (id: string, visible: string[]) => void;
    show: (id: string, visible: string[]) => void;
    move: (id: string, delta: -1 | 1, visible: string[]) => void;
    reset: () => void;
    moduleName: (id: string) => string;
    received: Map<string, DashboardPanel>;
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
        i18n: import("i18next").i18n;
        can: import("../../authz/types").CanFn;
        stats: NoInfer<import("./adminStats").Stats> | undefined;
        statsLoading: boolean;
        layout: import("../panels/usePanelLayout").PanelLayout;
        hide: (id: string, visible: string[]) => void;
        show: (id: string, visible: string[]) => void;
        move: (id: string, delta: -1 | 1, visible: string[]) => void;
        reset: () => void;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<import("./dashboard/api").DashboardData> | undefined;
        isLoading: boolean;
        isError: boolean;
        error: Error | null;
        modules: NoInfer<import("../adminModules").AdminModule[]> | undefined;
        moduleName: (id: string) => string;
        received: Map<string, DashboardPanel>;
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
    get total(): number;
    get activePct(): number;
    get healthy(): number;
    get modTotal(): number;
    get bucket(): import("../panels/types").PanelBucket;
    get withheldCount(): number;
    get show_case_1(): boolean;
    get show_main(): boolean;
    /** `<StatCard>`, rendered by a ReactHost. */
    get StatCard(): typeof __parts.StatCard;
    get stat_card_props(): {
        label: string;
        value: string;
        icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        tone: string;
        accent: string;
    };
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        n: (v?: number) => string;
        stats: NoInfer<import("./adminStats").Stats> | undefined;
        activePct: number;
    };
    /** A part of the screen still written in React (<StatCard> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    get stat_card_props2(): {
        label: string;
        value: string;
        icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        tone: string;
        accent: string;
    };
    get stat_card_props3(): {
        label: string;
        value: string;
        icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        tone: string;
        accent: string;
    };
    get part2_props(): {
        period: string;
        setPeriod: (value: DashboardSection["period"] | ((prev: DashboardSection["period"]) => DashboardSection["period"])) => void;
        periodOptions: {
            value: string;
            label: string;
        }[];
    };
    /** A part of the screen still written in React (<Dropdown> width, focusable: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        editing: boolean;
        setEditing: (value: DashboardSection["editing"] | ((prev: DashboardSection["editing"]) => DashboardSection["editing"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Button Icon>: an icon that is not a Lucide icon). */
    get Part3(): typeof __parts.Part3;
    get callout_text(): string;
    get show_data(): boolean;
    /** `<ReachNotice>`, rendered by a ReactHost. */
    get ReachNotice(): typeof __parts.ReachNotice;
    get reach_notice_props(): {
        periodId: string;
        retention: import("./dashboard/api").DashboardRetention;
    };
    get show_data_visible(): boolean;
    get part4_props(): {
        visible: string[];
        received: Map<string, DashboardPanel>;
        bucket: import("../panels/types").PanelBucket;
        editing: boolean;
        hide: (id: string, visible: string[]) => void;
        move: (id: string, delta: -1 | 1, visible: string[]) => void;
        openReport: (id: string) => void;
        moduleName: (id: string) => string;
    };
    /** A part of the screen still written in React (a list whose item is not a single element). */
    get Part4(): typeof __parts.Part4;
    get show_data_visible2(): boolean;
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        reset: () => void;
    };
    /** A part of the screen still written in React (<EmptyState> action.variant: no .kbview property). */
    get Part5(): typeof __parts.Part5;
    get show_editing_data(): boolean;
    get show_hidden_available(): boolean;
    get show_not_hidden_available(): boolean;
    get part6_props(): {
        hiddenAvailable: string[];
        show: (id: string, visible: string[]) => void;
        visible: string[];
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (a list whose item is not a single element). */
    get Part6(): typeof __parts.Part6;
    get show_data_withheld_count(): boolean;
    /** `<Slot>`, rendered by a ReactHost. */
    get Slot(): typeof Slot;
    get slot_props(): {
        name: string;
    };
    get slot_props2(): {
        name: string;
    };
    n(v?: number): string;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setPeriod` of the TSX: a value, or an update of the previous one. */
    setPeriod(value: DashboardSection['period'] | ((prev: DashboardSection['period']) => DashboardSection['period'])): void;
    /** `setEditing` of the TSX: a value, or an update of the previous one. */
    setEditing(value: DashboardSection['editing'] | ((prev: DashboardSection['editing']) => DashboardSection['editing'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DashboardSectionStores = ReturnType<DashboardSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type DashboardSectionHooks = ReturnType<DashboardSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionProps>>;
export default _default;
