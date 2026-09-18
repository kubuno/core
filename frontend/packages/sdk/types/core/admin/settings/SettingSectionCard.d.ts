import type { ReactNode } from 'react';
export interface SettingSectionCardProps {
    title: ReactNode;
    /**
     * What the section currently amounts to, right-aligned before the chevron:
     * how many knobs, how many of them no longer follow the level above. It is on
     * the RIGHT and not under the title because it is a state, not a subtitle —
     * a column of states down the right edge is what makes a folded page of eight
     * sections answer "where did we change something" without opening one.
     */
    status?: ReactNode;
    /** A real sentence about what the section governs, under the title. */
    description?: ReactNode;
    /** Leading glyph, when the section carries one (a module's own page icon). */
    icon?: ReactNode;
    /**
     * The left gutter of the open body: what scope these settings apply to. Comes
     * in as a node rather than being derived here — only the panel knows which
     * scope is on screen, and re-deriving it per section is how two sections of
     * the same page end up claiming two different scopes.
     *
     * Absent, the settings simply take the whole width.
     */
    aside?: ReactNode;
    /** The section's own save bar, under both columns. */
    footer?: ReactNode;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
    className?: string;
}
export default function SettingSectionCard({ title, status, description, icon, aside, footer, open, onToggle, children, className, }: SettingSectionCardProps): import("react").JSX.Element;
