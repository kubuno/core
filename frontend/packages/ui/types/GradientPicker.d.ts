import type { TFunction } from 'i18next';
import type { CSSProperties } from 'react';
import { type PickerTheme } from './ColorPicker';
import { type Gradient } from './gradient';
export declare function GradientPicker({ t, value, onChange, onClose, C: CProp }: {
    t?: TFunction;
    value: Gradient;
    onChange: (g: Gradient) => void;
    onClose?: () => void;
    C?: PickerTheme;
}): import("react").JSX.Element;
export declare function GradientField({ t, C: CProp, value, onChange, className, style, width, height }: {
    t?: TFunction;
    C?: PickerTheme;
    value: Gradient;
    onChange: (g: Gradient) => void;
    className?: string;
    style?: CSSProperties;
    width?: number;
    height?: number;
}): import("react").JSX.Element;
