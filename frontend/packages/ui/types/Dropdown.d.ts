import React from 'react';
export interface DropdownOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}
type DropdownVariant = 'default' | 'dark' | 'ghost';
interface DropdownProps {
    value: string;
    onChange: (v: string) => void;
    options: DropdownOption[];
    /** Fixed width in px or CSS string (e.g. '100%'). Omit for natural/flex sizing. */
    width?: number | string;
    /** Explicit min-width for the dropdown list. Defaults to trigger width. */
    dropdownMinWidth?: number;
    placeholder?: string;
    disabled?: boolean;
    /** Trigger height in px (default 28 — matches toolbar style) */
    height?: number;
    fontSize?: number;
    className?: string;
    variant?: DropdownVariant;
    /** Extra styles merged into the trigger button (e.g. to square joined corners). */
    buttonStyle?: React.CSSProperties;
    /**
     * Whether the trigger takes the focus a click hands it.
     *
     * `'auto'` (the default) is what a native select does — the click moves the
     * focus here, so the field the reader has just left goes dark — EXCEPT when
     * a text-editing surface holds the focus, where the click leaves it there so
     * the selection a toolbar is about to act on survives (see focusGuard.ts).
     * `true` always takes it; `false` never does. Neither is needed by a form.
     */
    focusable?: boolean | 'auto';
}
export declare function Dropdown({ value, onChange, options, width, dropdownMinWidth, placeholder, disabled, height, fontSize, className, variant, buttonStyle, focusable, }: DropdownProps): React.JSX.Element;
export {};
