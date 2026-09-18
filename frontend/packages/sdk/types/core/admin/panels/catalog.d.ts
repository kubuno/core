import type { PanelSource } from './report';
import type { PanelDef } from './types';
/**
 * Every panel of every panelled page, in one place — for the surfaces that have
 * to work across both dashboards rather than inside one.
 *
 * There is exactly one such surface today: the report page, which is opened
 * from either dashboard and has to spell a title, an explanation and a legend
 * for a panel it did not draw. It cannot import "the" panel table, because
 * there are two of them and the two are deliberately separate — a panel belongs
 * to the page that decided what it means.
 *
 * So this module joins them WITHOUT merging them: each entry keeps the source it
 * came from, and a lookup that is given a source never leaves it. Ids are unique
 * within a table and not across the two (`signins` is on both pages, with
 * different wording), which is precisely why a merged map keyed on the id alone
 * would be wrong.
 */
export interface CataloguedPanel {
    source: PanelSource;
    def: PanelDef;
}
/** Every panel, in the order its own dashboard declares it. */
export declare const PANEL_CATALOGUE: CataloguedPanel[];
/** The panels of one dashboard, in its own order. */
export declare function panelsOf(source: PanelSource): PanelDef[];
/**
 * The panel an address names.
 *
 * With a `source`, the lookup stays inside that catalogue — the only correct
 * answer, since the same id means two different documents on the two pages.
 * Without one (a hand-typed address, a bookmark from before the parameter
 * existed) the general dashboard is tried first, then the security overview:
 * a best effort that is stated here rather than left to a caller to reinvent.
 *
 * `null` for an id neither table knows — a panel a newer server grew, or a
 * typo. The report page says so instead of rendering a document with no title.
 */
export declare function findPanel(panelId: string, source?: string | null): CataloguedPanel | null;
