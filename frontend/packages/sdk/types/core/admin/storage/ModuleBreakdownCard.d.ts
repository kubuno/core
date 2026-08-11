import type { ModuleBreakdown } from './api';
/**
 * Where the consumed bytes came from.
 *
 * ## The one rule this card exists to obey
 *
 * **Nothing here is inferred from `used_bytes`.** Every figure is something a
 * module said about itself through `POST /internal/storage/usage`. A module that
 * never declared is drawn as *unknown*, never as zero — the two are different
 * facts and telling them apart is the entire point. Whatever the declarations
 * do not cover is its own named slice ("not attributed"), so the gap in the
 * picture is visible rather than absorbed into whichever module happens to be
 * biggest.
 *
 * ## Two readings, and why they do not add up to each other
 *
 * The **first bar is what is charged**: the share of each module's declaration
 * that counts against a quota, plus the part nobody claimed. It answers "why is
 * this account full".
 *
 * The **second reading is what is occupied**: everything the modules physically
 * hold, split by category, billed or not. It answers "how big a disk do I need".
 * It is legitimately larger than the first — thumbnails, indexes and caches take
 * room without being charged to anyone, on purpose: a user never asked for them
 * and cannot delete them.
 *
 * `delegated` sits in neither. It is bytes one module caused and another module
 * stores, and the one that stores them already counts them; it is drawn as a
 * separate note precisely so the anti-double-count rule is visible instead of
 * being an invisible subtraction.
 *
 * ## Colour
 *
 * Series identity comes from the fixed categorical scale `--kb-chart-1..8`,
 * assigned **by module id in a stable order** and never by rank: a module that
 * grows past another must not swap colours with it, or the reader learns that
 * the colours mean nothing. Past the scale's eight slots the remainder folds
 * into one "other modules" entry rather than inventing a ninth hue.
 *
 * The dark steps are a separate, separately-validated set rather than a filter
 * over the light ones, and they are chosen here in JS: Kubuno's themes are
 * applied by writing variables from the theme store, not through
 * `prefers-color-scheme`, so a CSS-only switch would stay light on a
 * hand-picked dark theme. `useUiTheme` is the same answer `MenuDropdown` uses.
 *
 * The residual slice is deliberately *not* on that scale: it is not an identity,
 * it is the absence of one, and giving it a series colour would make it read as
 * a module called "unattributed". It takes the same neutral the volume bar uses
 * for unaccounted content.
 *
 * Three of the light-mode series sit under 3:1 against a white card, which is
 * legal only because the legend names every series with its value beside it —
 * colour is never the only way to tell two slices apart here.
 */
export default function ModuleBreakdownCard({ data }: {
    data: ModuleBreakdown;
}): import("react").JSX.Element;
