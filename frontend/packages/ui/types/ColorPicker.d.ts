import { type ReactNode } from 'react';
import type { TFunction } from 'i18next';
export type PickerTheme = {
    accent: string;
    border: string;
    text: string;
    textDim: string;
    toolbar: string;
    surface?: string;
    title?: string;
};
export type PickerTool = {
    id: string;
    icon: ReactNode;
    title: string;
    active?: boolean;
    onClick: () => void;
};
export declare const DEFAULT_PICKER_THEME: PickerTheme;
export declare const LIGHT_PICKER_THEME: PickerTheme;
export declare function appPickerTheme(): Required<PickerTheme>;
export declare function useAppPickerTheme(): Required<PickerTheme>;
export type Scheme = 'comp' | 'analog' | 'triad' | 'tetrad' | 'split' | 'mono';
export declare function harmonyColors(scheme: Scheme, h: number, s: number, v: number): [number, number, number][];
export declare function ColorPicker({ t, color, onChange, onClose, C: CProp, history, onPickHistory, onConfirm, onCancel, confirmLabel, cancelLabel, leftTools }: {
    t?: TFunction;
    color: string;
    onChange: (hex: string) => void;
    onClose: () => void;
    C?: PickerTheme;
    history?: string[];
    onPickHistory?: (hex: string) => void;
    onConfirm?: (hex: string) => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    leftTools?: PickerTool[];
}): import("react").JSX.Element;
