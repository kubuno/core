/**
 * Code-behind of `PanelCard.kbview` (converted from `PanelCard.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { DashboardPanel, PanelBucket, PanelDef } from "./types";
import { AreaChart } from "../AreaChart";
import { BarChart } from "../BarChart";
import { ViewBase } from './PanelCard.kbview';
import * as __parts from './PanelCard.parts';
interface Props {
    def: PanelDef;
    panel: DashboardPanel;
    bucket: PanelBucket;
    /** Only rendered while the page is in edit mode. */
    editing: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onHide: () => void;
    onMove: (delta: -1 | 1) => void;
    onReport: () => void;
    /**
     * Spells one breakdown key, when the wording is not a translation key but a
     * fact this build has to look up — a module's display name, say. Takes
     * precedence over `def.legendKey`.
     */
    labelSlice?: (key: string) => string;
}
export type { Props };
export declare class PanelCard extends ViewBase {
    tr: PanelCardStores['t'];
    i18n: PanelCardStores['i18n'];
    series: readonly string[];
    fmt: (v: number) => string;
    points: {
        label: string;
        value: number;
    }[];
    donut: {
        label: string;
        value: number;
        color: string;
    }[];
    ranking: {
        label: string;
        value: number;
        max: number;
        sub: string;
    }[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        series: readonly string[];
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        fmt: (v: number) => string;
        points: {
            label: string;
            value: number;
        }[];
        sliceLabel: (key: string) => string;
        donut: {
            label: string;
            value: number;
            color: string;
        }[];
        ranking: {
            label: string;
            value: number;
            max: number;
            sub: string;
        }[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get Icon(): import("lucide-react").LucideIcon;
    get bytes(): boolean;
    get previous(): number | null;
    get snapshot(): boolean;
    get delta(): number | null;
    get rising(): boolean;
    get falling(): boolean;
    get worse(): boolean;
    get better(): boolean;
    get DeltaIcon(): import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    get deltaColor(): "text-text-secondary" | "text-danger" | "text-success";
    get capacity(): number;
    get pct(): number;
    get empty(): boolean;
    get caveatKey(): (id: string) => string;
    get caveat(): string;
    get part1_props(): {
        Icon: import("lucide-react").LucideIcon;
    };
    /** A part of the screen still written in React (<Icon> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    get h3_text(): string;
    get p_text(): string;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        onMove: (delta: -1 | 1) => void;
        canMoveUp: boolean;
    };
    /** A part of the screen still written in React (<ToolTip> label: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        onMove: (delta: -1 | 1) => void;
        canMoveDown: boolean;
    };
    /** A part of the screen still written in React (<ToolTip> label: no .kbview property). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        onHide: () => void;
    };
    /** A part of the screen still written in React (<ToolTip> label: no .kbview property). */
    get Part4(): typeof __parts.Part4;
    get span_text(): string;
    get show_not_snapshot(): boolean;
    get show_delta(): boolean;
    get show_not_delta(): boolean;
    get span_class(): string;
    get part5_props(): {
        DeltaIcon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    };
    /** A part of the screen still written in React (<DeltaIcon> is no .kbview element (a local or dynamic component)). */
    get Part5(): typeof __parts.Part5;
    get text(): "" | "+";
    get visible(): boolean;
    get visible2(): boolean;
    get show_not_empty(): boolean;
    get show_def_shape_gauge(): boolean;
    get show_not_def_shape_gauge(): boolean;
    /** `<ProgressRing>`, rendered by a ReactHost. */
    get ProgressRing(): import("react").FunctionComponent<Readonly<import("../ProgressRing").ProgressRingProps>>;
    get progress_ring_props(): {
        pct: number;
        value: string;
        label: string;
        color: string;
        sub: string;
    };
    get show_def_shape_donut(): boolean;
    get show_not_def_shape_donut(): boolean;
    /** `<DonutChart>`, rendered by a ReactHost. */
    get DonutChart(): import("react").FunctionComponent<Readonly<import("../DonutChart").DonutChartProps>>;
    get donut_chart_props(): {
        data: {
            label: string;
            value: number;
            color: string;
        }[];
        size: number;
        centerValue: string;
    };
    get show_def_shape_ranking(): boolean;
    get show_not_def_shape_ranking(): boolean;
    /** `<HBarList>`, rendered by a ReactHost. */
    get HBarList(): import("react").FunctionComponent<Readonly<import("../HBarList").HBarListProps>>;
    get hbar_list_props(): {
        items: {
            label: string;
            value: number;
            max: number;
            sub: string;
        }[];
        color: string;
    };
    get show_def_shape_area(): boolean;
    get show_not_def_shape_area(): boolean;
    /** `<AreaChart>`, rendered by a ReactHost. */
    get AreaChart(): typeof AreaChart;
    get area_chart_props(): {
        data: {
            label: string;
            value: number;
        }[];
        color: string;
        height: number;
    };
    /** `<BarChart>`, rendered by a ReactHost. */
    get BarChart(): typeof BarChart;
    get bar_chart_props(): {
        data: {
            label: string;
            value: number;
        }[];
        color: string;
        height: number;
    };
    get visible3(): boolean;
    get visible4(): boolean;
    get visible5(): boolean;
    get visible6(): boolean;
    get visible7(): boolean;
    get visible8(): boolean;
    get visible9(): boolean;
    get visible10(): boolean;
    get visible11(): boolean;
    get visible12(): boolean;
    get visible13(): boolean;
    get visible14(): boolean;
    get visible15(): boolean;
    get visible16(): boolean;
    get show_caveat(): boolean;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type PanelCardStores = ReturnType<PanelCard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type PanelCardHooks = ReturnType<PanelCard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
