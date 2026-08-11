import type { ReactNode } from 'react';
import type { SettingItem } from './moduleSettingSchema';
/**
 * A run of rows, plus the "Avancé" disclosure that holds back the expert knobs.
 *
 * The disclosure is not decoration: `mail` declares nearly a third of its
 * settings `advanced`, and showing them by default is the difference between a
 * page an operator reads and one they scroll past.
 */
export declare function SettingRows({ basic, advanced, advancedOpen, onToggleAdvanced, renderRow }: {
    basic: SettingItem[];
    advanced: SettingItem[];
    advancedOpen: boolean;
    onToggleAdvanced: () => void;
    renderRow: (item: SettingItem) => ReactNode;
}): import("react").JSX.Element;
/**
 * A category as a collapsible section — the panel of a module that declares no
 * page, and the way a search result announces where it was found.
 *
 * The title is plain 14px bold: no small caps, no accent bar.
 */
export declare function CollapsibleCategory({ title, aside, count, changed, collapsed, onToggle, children }: {
    title: ReactNode;
    /** Rendered right after the title, muted — "where this lives", typically. */
    aside?: ReactNode;
    count: number;
    /** How many of these differ from their factory value. 0 shows nothing. */
    changed: number;
    collapsed: boolean;
    onToggle: () => void;
    children: ReactNode;
}): import("react").JSX.Element;
