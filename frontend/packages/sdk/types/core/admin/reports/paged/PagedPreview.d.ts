import type { FlowItem } from './types';
import type { Orientation, PaperFormat } from './geometry';
import type { WatermarkSpec } from './watermark';
export default function PagedPreview({ items, format, orientation, cover, footer, revision, watermark, onToggleCover, onOrientation, bandHeight, }: {
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
}): import("react").JSX.Element;
