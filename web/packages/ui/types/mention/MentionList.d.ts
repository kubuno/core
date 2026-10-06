import type { MentionItem } from './types';
export interface MentionListProps {
    items: MentionItem[];
    activeIndex: number;
    query: string;
    /** Viewport rect of the caret; the list drops just below it. */
    anchorRect: DOMRect | null;
    onPick: (item: MentionItem) => void;
    onHover?: (index: number) => void;
    loading?: boolean;
}
/**
 * Dropdown of mention candidates, portalled to <body> and positioned near the
 * caret. Selection happens on `pointerdown` + `preventDefault` so it lands
 * before the field loses focus. The matching sub-string of the label is
 * emboldened, accent- and case-insensitively.
 */
export declare function MentionList({ items, activeIndex, query, anchorRect, onPick, onHover, loading, }: MentionListProps): import("react").ReactPortal | null;
