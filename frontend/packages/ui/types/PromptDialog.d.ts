export interface PromptOptions {
    title: string;
    message?: string;
    defaultValue?: string;
    placeholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    multiline?: boolean;
    /** Autorise une valeur vide à la validation (sinon le bouton est désactivé). */
    allowEmpty?: boolean;
}
interface Props extends PromptOptions {
    onConfirm: (value: string) => void;
    onCancel: () => void;
}
export default function PromptDialog({ title, message, defaultValue, placeholder, confirmLabel, cancelLabel, multiline, allowEmpty, onConfirm, onCancel, }: Props): import("react").JSX.Element;
export {};
