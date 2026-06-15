import React from 'react';
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
    /** 'sm' → px-3 py-1.5 text-xs  |  'md' (default) → px-4 py-2 text-sm */
    size?: 'sm' | 'md';
    /**
     * underline (default) — bottom-border indicator, horizontal scroll
     * pills               — rounded pill background, no border
     * stretched           — each tab fills equal width, bottom border
     */
    variant?: 'underline' | 'pills' | 'stretched';
}
export declare function Tabs<T extends string = string>({ tabs, value, onChange, className, size, variant, }: TabsProps<T>): React.JSX.Element;
