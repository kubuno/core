/**
 * Code-behind of `PagedPreview.kbview` (converted from `PagedPreview.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { MenuItem } from "@ui";
import type { Metrics } from "./paginate";
import type { FlowItem, Sheet } from "./types";
import type { Orientation, PageGeometry, PaperFormat } from "./geometry";
import type { WatermarkSpec } from "./watermark";
import { ViewBase } from './PagedPreview.kbview';
import * as __parts from './PagedPreview.parts';
export type PagedPreviewProps = {
    items: FlowItem[];
    format: PaperFormat;
    /** The document's default. Individual sheets may be turned against it. */
    orientation: Orientation;
    /** Front sheet, when the operator asked for one. Never numbered. */
    cover?: React.ReactNode;
    /** Running footer. `page`/`total` count every sheet, cover included. */
    footer: (page: number, total: number) => React.ReactNode;
    /** Changes when the document's CONTENT does, forcing a fresh measurement. */
    revision: string;
    /** The stamp across every sheet — text or picture. See `watermark.ts`. */
    watermark?: WatermarkSpec;
    /** Toggling the cover from the sheet's own context menu. */
    onToggleCover?: () => void;
    /** Turning the WHOLE document from the same menu. */
    onOrientation?: (o: Orientation) => void;
    /**
     * Height of the frozen band above the preview (breadcrumb + toolbar).
     *
     * The rail of thumbnails is pinned too — a page list that scrolls away with
     * the pages is a page list you have to leave the page to reach. It pins
     * DIRECTLY under the band: a sticky top is measured from the scrolling
     * ancestor's padding box (24 px here), hence the offset.
     */
    bandHeight?: number;
};
export declare class PagedPreview extends ViewBase {
    accessor sheets: Sheet[];
    accessor cols: Record<Orientation, Record<string, number[]>>;
    accessor flips: Record<number, Orientation>;
    accessor zoomWanted: number | null;
    accessor fitZoom: number;
    accessor active: number;
    accessor geoTick: number;
    accessor menuSheet: number | null;
    tr: PagedPreviewStores['t'];
    measureRef: PagedPreviewStores['measureRef'];
    footerRef: PagedPreviewStores['footerRef'];
    frameRef: PagedPreviewStores['frameRef'];
    sheetRefs: PagedPreviewStores['sheetRefs'];
    orientOf: (index: number) => Orientation;
    geos: PagedPreviewHooks['geos'];
    stackPx: number;
    menu: PagedPreviewStores['menu'];
    menuItems: MenuItem[];
    stamps: {
        portrait: string | undefined;
        landscape: string | undefined;
    };
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        measureRef: import("react").RefObject<HTMLDivElement | null>;
        footerRef: import("react").RefObject<HTMLDivElement | null>;
        frameRef: import("react").RefObject<HTMLDivElement | null>;
        sheetRefs: import("react").RefObject<(HTMLElement | null)[]>;
        menu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        orientOf: (index: number) => Orientation;
        geos: import("react").RefObject<Record<Orientation, PageGeometry>>;
        measureAt: (root: HTMLElement, widthPx: number) => {
            metrics: Metrics;
            widths: Record<string, number[]>;
        };
        layout: () => void;
        stackPx: number;
        menuItems: MenuItem[];
        stamps: {
            portrait: string | undefined;
            landscape: string | undefined;
        };
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get bandHeight(): number;
    get total(): number;
    get firstOrientation(): Orientation;
    get widestMm(): number;
    get zoom(): number;
    get byId(): Map<string, FlowItem>;
    get stampVars(): import("react").CSSProperties;
    get part1_props(): {
        geos: import("react").RefObject<Record<Orientation, PageGeometry>>;
        firstOrientation: Orientation;
    };
    /** A part of the screen still written in React (<style> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        measureRef: import("react").RefObject<HTMLDivElement | null>;
        items: FlowItem[];
    };
    /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        footerRef: import("react").RefObject<HTMLDivElement | null>;
        footer: (page: number, total: number) => React.ReactNode;
    };
    /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        frameRef: import("react").RefObject<HTMLDivElement | null>;
        zoom: number;
        stackPx: number;
        stampVars: import("react").CSSProperties;
        cover: import("react").ReactNode;
        orientation: Orientation;
        setMenuSheet: (value: number | null | ((prev: number | null) => number | null)) => void;
        menu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
        sheetRefs: import("react").RefObject<(HTMLElement | null)[]>;
        styleOf: (g: PageGeometry) => React.CSSProperties;
        geos: import("react").RefObject<Record<Orientation, PageGeometry>>;
        sheets: Sheet[];
        orientOf: (index: number) => Orientation;
        setFlips: (value: Record<number, Orientation> | ((prev: Record<number, Orientation>) => Record<number, Orientation>)) => void;
        t: import("i18next").TFunction<"translation", undefined>;
        sheetContent: (sheet: Sheet, index: number) => import("react").JSX.Element;
    };
    /** A part of the screen still written in React (<div ref>: attribute(s) without a .kbview property). */
    get Part4(): typeof __parts.Part4;
    get show_total(): boolean;
    get part5_props(): {
        stampVars: import("react").CSSProperties;
        bandHeight: number;
        t: import("i18next").TFunction<"translation", undefined>;
        cover: import("react").ReactNode;
        thumb: (page: number, g: PageGeometry, body: React.ReactNode, o: Orientation) => import("react").JSX.Element;
        geos: import("react").RefObject<Record<Orientation, PageGeometry>>;
        orientation: Orientation;
        sheets: Sheet[];
        orientOf: (index: number) => Orientation;
        sheetContent: (sheet: Sheet, index: number) => import("react").JSX.Element;
    };
    /** A part of the screen still written in React (<aside> with a computed style). */
    get Part5(): typeof __parts.Part5;
    get show_menu_pos(): boolean;
    get part6_props(): {
        menuItems: MenuItem[];
        menu_pos: import("@ui").MenuDropdownPos;
        menu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
    };
    /** A part of the screen still written in React (<ContextMenu> pos, onClose: no .kbview property). */
    get Part6(): typeof __parts.Part6;
    get part7_props(): {
        active: number;
        total: number;
        setActive: (value: PagedPreview["active"] | ((prev: PagedPreview["active"]) => PagedPreview["active"])) => void;
        goTo: (page: number) => void;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<input> has no .kbview element yet). */
    get Part7(): typeof __parts.Part7;
    get span_text(): string;
    get text(): number;
    goTo(page: number): void;
    sheetContent(sheet: Sheet, index: number): import("react").JSX.Element;
    styleOf(g: PageGeometry): React.CSSProperties;
    thumb(page: number, g: PageGeometry, body: React.ReactNode, o: Orientation): import("react").JSX.Element;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
    panel_click2(_sender: unknown, _args: MouseEventArgs): void;
    panel_click3(_sender: unknown, _args: MouseEventArgs): void;
    panel_click4(_sender: unknown, _args: MouseEventArgs): void;
    /** `setMenuSheet` of the TSX: a value, or an update of the previous one. */
    setMenuSheet(value: number | null | ((prev: number | null) => number | null)): void;
    /** `setFlips` of the TSX: a value, or an update of the previous one. */
    setFlips(value: Record<number, Orientation> | ((prev: Record<number, Orientation>) => Record<number, Orientation>)): void;
    /** `setActive` of the TSX: a value, or an update of the previous one. */
    setActive(value: PagedPreview['active'] | ((prev: PagedPreview['active']) => PagedPreview['active'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type PagedPreviewStores = ReturnType<PagedPreview['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type PagedPreviewHooks = ReturnType<PagedPreview['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<PagedPreviewProps>>;
export default _default;
