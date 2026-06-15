type CheckboxVariant = 'default' | 'dark';
interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    variant?: CheckboxVariant;
    /** Couleur d'accent (coché). Défaut : bleu primaire. Ex. couleur d'un agenda. */
    color?: string;
    disabled?: boolean;
    className?: string;
    labelClassName?: string;
}
export declare function Checkbox({ checked, onChange, label, description, variant, color, disabled, className, labelClassName, }: CheckboxProps): import("react").JSX.Element;
export {};
