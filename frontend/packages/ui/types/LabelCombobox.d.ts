export interface LabelComboboxProps {
    value: string;
    onChange: (v: string) => void;
    primaryColor: string;
    presets: string[];
    /** Field label; defaults to "Libellé". */
    label?: string;
    large?: boolean;
}
export declare function LabelCombobox({ value, onChange, primaryColor, presets, label, large }: LabelComboboxProps): import("react").JSX.Element;
