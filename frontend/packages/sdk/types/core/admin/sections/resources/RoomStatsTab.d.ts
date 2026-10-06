import { ViewBase } from './RoomStatsTab.kbview';
import * as __parts from './RoomStatsTab.parts';
export declare class RoomStatsTab extends ViewBase {
    accessor period: string;
    tr: RoomStatsTabStores['t'];
    i18n: RoomStatsTabStores['i18n'];
    series: readonly string[];
    from: string;
    data: RoomStatsTabHooks['data'];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    periodOptions: {
        value: string;
        label: string;
    }[];
    nf: RoomStatsTabStores['nf'];
    nf1: RoomStatsTabStores['nf1'];
    dayFm: RoomStatsTabStores['dayFm'];
    perDay: {
        label: string;
        value: number;
    }[];
    perHour: {
        label: string;
        value: number;
    }[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        series: readonly string[];
        periodOptions: {
            value: string;
            label: string;
        }[];
        nf: Intl.NumberFormat;
        nf1: Intl.NumberFormat;
        dayFm: Intl.DateTimeFormat;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        from: string;
        to: string;
        data: NoInfer<import("./api").RoomStats> | undefined;
        isLoading: boolean;
        isError: boolean;
        error: Error | null;
        perDay: {
            label: string;
            value: number;
        }[];
        perHour: {
            label: string;
            value: number;
        }[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get rooms(): {
        resource_id: string;
        name: string;
        capacity: number;
        hours: number;
        bookings: number;
        declined: number;
    }[];
    get topHours(): number;
    get answered(): number;
    get acceptance(): number | null;
    get absent(): boolean;
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get variant(): "error" | "unavailable";
    get title(): string;
    get description(): string;
    get show_main(): boolean;
    get part1_props(): {
        period: string;
        setPeriod: (value: RoomStatsTab["period"] | ((prev: RoomStatsTab["period"]) => RoomStatsTab["period"])) => void;
        periodOptions: {
            value: string;
            label: string;
        }[];
    };
    /** A part of the screen still written in React (<Dropdown> width, focusable: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_data(): boolean;
    get rs_scope_count(): number;
    get rs_scope_hours(): number;
    get callout_text(): string;
    /** `<StatCard>`, rendered by a ReactHost. */
    get StatCard(): typeof __parts.StatCard;
    get stat_card_props(): {
        label: string;
        icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        value: string;
        accent: string;
    };
    get stat_card_props2(): {
        label: string;
        icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        value: string;
    };
    get stat_card_props3(): {
        label: string;
        icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        value: string;
        accent: string;
    };
    get stat_card_props4(): {
        label: string;
        icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        value: string;
        accent: string;
    };
    get show_answered(): boolean;
    get show_not_answered(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        perDay: {
            label: string;
            value: number;
        }[];
        series: readonly string[];
    };
    /** A part of the screen still written in React (<ChartCard> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        perHour: {
            label: string;
            value: number;
        }[];
        series: readonly string[];
    };
    /** A part of the screen still written in React (<ChartCard> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        rooms: {
            resource_id: string;
            name: string;
            capacity: number;
            hours: number;
            bookings: number;
            declined: number;
        }[];
        series: readonly string[];
        topHours: number;
        nf1: Intl.NumberFormat;
    };
    /** A part of the screen still written in React (<ChartCard> is no .kbview element (a local or dynamic component)). */
    get Part4(): typeof __parts.Part4;
    get p_text(): string;
    hours(n: number): string;
    pct(n: number | null | undefined): string;
    /** `setPeriod` of the TSX: a value, or an update of the previous one. */
    setPeriod(value: RoomStatsTab['period'] | ((prev: RoomStatsTab['period']) => RoomStatsTab['period'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RoomStatsTabStores = ReturnType<RoomStatsTab['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type RoomStatsTabHooks = ReturnType<RoomStatsTab['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
