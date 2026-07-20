import React from 'react';
export interface AccordionItemDef {
    id: string;
    title: React.ReactNode;
    icon?: React.ComponentType<any>;
    badge?: number | string;
    content: React.ReactNode;
    /** Disable toggling for this item (renders muted, stays collapsed). */
    disabled?: boolean;
}
export interface AccordionProps {
    items: AccordionItemDef[];
    /** Ids expanded initially (uncontrolled). Default `[]` → everything collapsed. */
    defaultOpen?: string[];
    /** Controlled expanded ids. When set, `onOpenChange` drives the state. */
    open?: string[];
    onOpenChange?: (open: string[]) => void;
    /** Only one item open at a time (classic accordion). Default `false`. */
    single?: boolean;
    className?: string;
    /** 'sm' → tighter header padding | 'md' (default). */
    size?: 'sm' | 'md';
}
/**
 * Accordion — a stack of collapsible groups. Each item has a clickable header
 * (title + chevron) and a panel that expands/collapses with a height animation.
 * Uncontrolled by default (start collapsed via `defaultOpen`); pass `open` +
 * `onOpenChange` to control it. Panels stay mounted so their inner state and any
 * overlays keep working across toggles.
 */
export declare function Accordion({ items, defaultOpen, open, onOpenChange, single, className, size, }: AccordionProps): React.JSX.Element;
