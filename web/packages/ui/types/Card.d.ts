import type { ReactNode } from 'react';
export interface CardProps {
    /** Section heading. Omit for a bare surface with no header band. */
    title?: ReactNode;
    /** Leading glyph shown before the title (a lucide icon element, typically). */
    icon?: ReactNode;
    /** Trailing controls of the header row (buttons, a menu, a badge…). */
    actions?: ReactNode;
    /** Secondary line under the title. */
    subtitle?: ReactNode;
    /** Bottom band, separated by a hairline — totals, pagination, a submit row. */
    footer?: ReactNode;
    /** Tighter padding, for cards stacked in a dense settings column. */
    dense?: boolean;
    /** Drop the body padding entirely — for a table or list that must bleed to the
     *  card edges (the DataTable does this). */
    flush?: boolean;
    className?: string;
    bodyClassName?: string;
    children?: ReactNode;
}
/**
 * Card — the single container for a titled block of admin/settings content.
 *
 * It replaces the three hand-copied variants that had drifted apart across the
 * admin panels (different radii, different border colours, headers built with
 * three different markups). Everything here is token-driven: `bg-surface-0`,
 * `border-border` and the `--kb-*` scales, so a theme that remaps its variables
 * — light or dark — re-skins every card at once.
 *
 * The root is `min-w-0` on purpose: a card is routinely a flex/grid child, and
 * without it a wide child (a table, a long path) would push the card past its
 * track and make the PAGE scroll horizontally. Wide content scrolls inside its
 * own box instead (see `flush` + DataTable).
 */
export declare function Card({ title, icon, actions, subtitle, footer, dense, flush, className, bodyClassName, children, }: CardProps): import("react").JSX.Element;
