export type ConfirmVariant = 'danger' | 'warning' | 'default';
export interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    /** Masque le bouton « Annuler » → dialogue d'information à un seul bouton. */
    hideCancel?: boolean;
}
interface Props extends ConfirmOptions {
    onConfirm: () => void;
    onCancel: () => void;
}
export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel, variant, hideCancel, onConfirm, onCancel, }: Props): import("react").JSX.Element;
export {};
