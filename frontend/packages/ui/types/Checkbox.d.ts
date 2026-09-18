import { type CheckboxVariant } from './checkboxCanvas';
interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    /**
     * Tri-state, for a partial selection. Drawn as a dash and mirrored onto the input's
     * DOM property (the only place the tri-state exists — markup cannot express it).
     */
    indeterminate?: boolean;
    label?: string;
    description?: string;
    variant?: CheckboxVariant;
    /** Accent color (when checked). Defaults to the theme primary. E.g. a calendar color. */
    color?: string;
    disabled?: boolean;
    className?: string;
    labelClassName?: string;
}
/**
 * The box is drawn on a canvas; the hidden `<input type="checkbox">` keeps every
 * native behaviour (label association, keyboard, form submission, assistive
 * technologies). The input remains the single source of truth, exactly as when CSS
 * read `:checked` — the canvas only mirrors it.
 *
 * Same architecture as `Toggle` and `Radio`, including the four repaint triggers: a
 * canvas is a bitmap, so everything CSS used to redo for free has to be re-wired.
 */
export declare function Checkbox({ checked, onChange, indeterminate, label, description, variant, color, disabled, className, labelClassName, }: CheckboxProps): import("react").JSX.Element;
export {};
