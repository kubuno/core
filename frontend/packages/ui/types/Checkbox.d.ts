type CheckboxVariant = 'default' | 'dark';
interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    variant?: CheckboxVariant;
    /** Accent color (when checked). Defaults to the theme primary. E.g. a calendar color. */
    color?: string;
    disabled?: boolean;
    className?: string;
    labelClassName?: string;
}
export declare function Checkbox({ checked, onChange, label, description, variant, color, disabled, className, labelClassName, }: CheckboxProps): import("react").JSX.Element;
export {};
