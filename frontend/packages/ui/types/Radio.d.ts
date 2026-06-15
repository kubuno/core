type RadioVariant = 'default' | 'dark';
interface RadioProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    variant?: RadioVariant;
    /** Couleur d'accent (coché). Défaut : bleu primaire. Ex. couleur d'un agenda. */
    color?: string;
    disabled?: boolean;
    className?: string;
    labelClassName?: string;
}
export declare function Radio({ checked, onChange, label, description, variant, color, disabled, className, labelClassName, }: RadioProps): import("react").JSX.Element;
export {};
