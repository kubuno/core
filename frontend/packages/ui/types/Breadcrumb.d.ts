/**
 * The trail that says where you are.
 *
 * Extracted from the file explorer's breadcrumb, which was the only one in the
 * product built as a component rather than as three spans in a page. Both now
 * render this: a second implementation would drift on the first hover colour
 * somebody adjusted, and a console whose trail looks different depending on the
 * screen is a console that teaches people to stop reading it.
 *
 * ## What it is, and what it is not
 *
 * It is a *navigation* landmark: `<nav>` labelled, an ordered list, the last
 * item marked `aria-current="page"` and deliberately NOT a link — you do not
 * navigate to where you already are. The chevrons are decoration and carry
 * `aria-hidden`, so a screen reader announces "Annuaire, lien — Utilisateurs,
 * page actuelle" rather than spelling out punctuation.
 *
 * It is not a back button. A back button answers "undo my last step"; a trail
 * answers "what contains this". Where a page offers both, the trail is the one
 * that survives arriving from a link.
 *
 * ## Collapsing
 *
 * Past `maxVisible` segments the middle is replaced by a `…` button that opens
 * the hidden ones — the first and the last two always stay. Wrapping onto a
 * second line was the alternative and it is worse: the trail sits in a fixed
 * bar, and a second line pushes the page's content down by a row that appears
 * and disappears as somebody navigates.
 */
import { type ReactNode } from 'react';
export interface Crumb {
    /** What the segment reads as. */
    label: ReactNode;
    /**
     * Where it goes. A real `href` when there is one — a trail is made of links,
     * and a link somebody cannot open in a new tab is a button in disguise.
     */
    href?: string;
    /** Called instead of following `href` (which is then prevented). */
    onClick?: () => void;
    /** Rendered before the label — a home glyph on the root, a folder, an avatar. */
    icon?: ReactNode;
    /** Plain-text form, for the collapsed menu and the tooltip. */
    title?: string;
}
export interface BreadcrumbProps {
    /** Root first, current page last. The last one is never a link. */
    items: Crumb[];
    /** Names the landmark. Give it the translated "Fil d'Ariane". */
    ariaLabel?: string;
    /**
     * How many segments stay visible before the middle collapses. Below 3 the
     * collapse cannot help — first and last already fill it.
     */
    maxVisible?: number;
    /** Rendered after the trail, on the same line (an action, a picker…). */
    trailing?: ReactNode;
    className?: string;
    /** Longest a single segment may grow before it truncates. */
    maxSegmentWidth?: string;
}
export declare function BreadcrumbBase({ items, ariaLabel, maxVisible, trailing, className, maxSegmentWidth, }: BreadcrumbProps): import("react").JSX.Element | null;
