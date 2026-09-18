import { type RadioVariant } from './radioCanvas';
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
/**
 * The control is drawn on a canvas; the hidden `<input type="radio">` keeps every
 * native behaviour (label association, keyboard, form submission, assistive
 * technologies, radio-group semantics). The input remains the single source of
 * truth, exactly as when CSS read `:checked` — the canvas only mirrors it.
 *
 * Same architecture as `Toggle`, including its four repaint triggers: a canvas is a
 * bitmap, so everything CSS used to redo for free has to be re-wired.
 */
export declare function Radio({ checked, onChange, label, description, variant, color, disabled, className, labelClassName, }: RadioProps): import("react").JSX.Element;
export {};
