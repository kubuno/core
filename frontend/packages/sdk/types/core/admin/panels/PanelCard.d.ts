import type { DashboardPanel, PanelBucket, PanelDef } from './types';
/**
 * One panel: what it counted, how it moved, and the way to the report that
 * carries the records behind it.
 *
 * ## The percentage
 *
 * Compared against the window of identical length immediately before the
 * reading, computed server-side so the two ends can never come from different
 * instants. When the previous window counted **zero**, no percentage is shown at
 * all: "+∞ %" and "+100 %" are both false, and the honest reading of 0 → 7 is
 * "seven, where there were none", which the figure already says.
 *
 * When `previous_total` is **null**, the panel describes the present and nothing
 * recorded its past — the card says so ("état actuel") rather than drawing an
 * arrow from a number nobody measured.
 *
 * ## The colour of the arrow
 *
 * From `polarity`, never from the sign. More failed sign-ins is not growth.
 *
 * ## The wording
 *
 * The chrome keys (`admin.sec_*`) were written for the first panelled page and
 * are now the shared vocabulary of all of them. They are deliberately NOT
 * re-spelt under a second prefix: two names for one sentence is how two pages
 * start saying it differently.
 */
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
export default function PanelCard({ def, panel, bucket, editing, canMoveUp, canMoveDown, onHide, onMove, onReport, labelSlice, }: Props): import("react").JSX.Element;
export {};
