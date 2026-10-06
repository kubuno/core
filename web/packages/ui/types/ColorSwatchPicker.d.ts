import type { TFunction } from 'i18next';
import { type PickerTheme } from './ColorPicker';
export declare function ColorSwatchPicker({ color, onChange, onClose, t, theme, customLabel, confirmLabel, cancelLabel, }: {
    color: string;
    onChange: (hex: string) => void;
    onClose?: () => void;
    t?: TFunction;
    theme?: PickerTheme;
    customLabel?: string;
    confirmLabel?: string;
    cancelLabel?: string;
}): import("react").JSX.Element;
