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
}
export declare function Dropdown({ value, onChange, options, width, dropdownMinWidth, placeholder, disabled, height, fontSize, className, variant, }: DropdownProps): React.JSX.Element;
export {};
