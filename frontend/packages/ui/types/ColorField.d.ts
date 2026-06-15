import type { TFunction } from 'i18next';
import type { CSSProperties } from 'react';
import { type PickerTheme } from './ColorPicker';
export declare function ColorField({ t, C, color, onChange, history, onPickHistory, className, style, width, height }: {
    t?: TFunction;
    C?: PickerTheme;
    color: string;
    onChange: (hex: string) => void;
    history?: string[];
    onPickHistory?: (hex: string) => void;
    className?: string;
    style?: CSSProperties;
    width?: number;
    height?: number;
}): import("react").JSX.Element;
