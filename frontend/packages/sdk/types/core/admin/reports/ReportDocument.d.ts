import type { PanelDef, PanelPeriod } from "../panels/types";
import type { ReportPanel } from "./api";
import type { WatermarkSpec } from "./paged/watermark";
import type { Orientation } from "./paged/geometry";
import type { FlowItem } from "./paged/types";
import { ViewBase } from './ReportDocument.kbview';
import * as __parts from './ReportDocument.parts';
export type ReportDocumentProps = {
    def: PanelDef;
    panel: ReportPanel;
    period: PanelPeriod;
    periods: string[];
    periodId: string;
    onPeriod: (id: string) => void;
    instance: string;
    author: string;
};
export declare class ReportDocument extends ViewBase {
    accessor paper: string;
    accessor orientation: Orientation;
    accessor cover: boolean;
    accessor crumbH: number;
    accessor barH: number;
    tr: ReportDocumentStores['t'];
    i18n: ReportDocumentStores['i18n'];
    series: readonly string[];
    watermark: WatermarkSpec;
    setWatermark: ReportDocumentStores['setWatermark'];
    barRef: ReportDocumentStores['barRef'];
    modules: ReportDocumentStores['modules'];
    moduleName: (id: string) => string;
    model: ReportDocumentHooks['model'];
    generatedAt: string;
    periodOptions: {
        value: string;
        label: string;
    }[];
    exportCsv: () => void;
    tones: (key: string, i: number) => string;
    seriesItem: FlowItem;
    breakdownItem: FlowItem;
    detailItem: FlowItem | null;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        series: readonly string[];
        watermark: WatermarkSpec;
        setWatermark: import("react").Dispatch<import("react").SetStateAction<WatermarkSpec>>;
        barRef: import("react").RefObject<HTMLDivElement | null>;
        modules: NoInfer<import("../adminModules").AdminModule[]> | undefined;
        moduleName: (id: string) => string;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        model: import("./model").ReportModel;
        generatedAt: string;
        periodOptions: {
            value: string;
            label: string;
        }[];
        exportCsv: () => void;
        tones: (key: string, i: number) => string;
        seriesItem: FlowItem;
        breakdownItem: FlowItem;
        detailItem: FlowItem | null;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get title(): string;
    get about(): string;
    get periodLabel(): string;
    get chart(): import("react").JSX.Element | null;
    get secondChart(): {
        titleKey: string;
        capped: boolean;
        node: import("react").JSX.Element;
    } | null;
    get items(): FlowItem[];
    get revision(): string;
    get part1_props(): {
        barRef: import("react").RefObject<HTMLDivElement | null>;
        crumbH: number;
        periodId: string;
        onPeriod: (id: string) => void;
        periodOptions: {
            value: string;
            label: string;
        }[];
        paper: string;
        setPaper: (value: ReportDocument["paper"] | ((prev: ReportDocument["paper"]) => ReportDocument["paper"])) => void;
        t: import("i18next").TFunction<"translation", undefined>;
        orientation: Orientation;
        setOrientation: (value: Orientation | ((prev: Orientation) => Orientation)) => void;
        cover: boolean;
        setCover: (value: ReportDocument["cover"] | ((prev: ReportDocument["cover"]) => ReportDocument["cover"])) => void;
        watermark: WatermarkSpec;
        setWatermark: import("react").Dispatch<import("react").SetStateAction<WatermarkSpec>>;
        exportCsv: () => void;
    };
    /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** `<PagedPreview>`, rendered by a ReactHost. */
    get PagedPreview(): import("react").FunctionComponent<Readonly<import("./paged/PagedPreview").PagedPreviewProps>>;
    get paged_preview_props(): Readonly<import("./paged/PagedPreview").PagedPreviewProps>;
    footer(page: number, total: number): import("react").JSX.Element;
    /** `setPaper` of the TSX: a value, or an update of the previous one. */
    setPaper(value: ReportDocument['paper'] | ((prev: ReportDocument['paper']) => ReportDocument['paper'])): void;
    /** `setOrientation` of the TSX: a value, or an update of the previous one. */
    setOrientation(value: Orientation | ((prev: Orientation) => Orientation)): void;
    /** `setCover` of the TSX: a value, or an update of the previous one. */
    setCover(value: ReportDocument['cover'] | ((prev: ReportDocument['cover']) => ReportDocument['cover'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ReportDocumentStores = ReturnType<ReportDocument['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ReportDocumentHooks = ReturnType<ReportDocument['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ReportDocumentProps>>;
export default _default;
