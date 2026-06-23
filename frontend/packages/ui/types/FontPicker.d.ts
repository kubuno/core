import React from 'react';
export interface FontPickerProps {
    value: string;
    onChange: (font: string) => void;
    fonts: readonly string[];
    recent?: readonly string[];
    width?: number | string;
    height?: number;
    fontSize?: number;
    disabled?: boolean;
    className?: string;
    variant?: 'default' | 'ghost';
}
export declare function FontPicker({ value, onChange, fonts, recent, width, height, fontSize, disabled, className, variant, }: FontPickerProps): React.JSX.Element;
