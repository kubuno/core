import React from 'react';
import type { TFunction } from 'i18next';
export interface TabDef<T extends string = string> {
    id: T;
    label: string;
    icon?: React.ComponentType<any>;
    badge?: number | string;
}
export interface TabsProps<T extends string = string> {
    tabs: TabDef<T>[];
    value: T;
    onChange: (value: T) => void;
    /** Extra classes applied to the outer container */
    className?: string;
    /** Label text is the default size either way; the sizes differ only in padding.
     *  'sm' → px-3 py-1.5  |  'md' (default) → px-4 py-2 */
    size?: 'sm' | 'md';
    /**
     * underline (default) — bottom-border indicator, horizontal scroll
     * pills               — rounded pill background, no border
     * stretched           — each tab fills equal width, bottom border
     *
     * Every variant is exactly as tall as its tallest tab.
     */
    variant?: 'underline' | 'pills' | 'stretched';
    /** Localises the scroll-arrow labels; falls back to English when absent. */
    t?: TFunction;
}
export declare function Tabs<T extends string = string>({ tabs, value, onChange, className, size, variant, t, }: TabsProps<T>): React.JSX.Element;
