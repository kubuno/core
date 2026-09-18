interface Props {
    open: boolean;
    onClose: () => void;
    /** Re-connecting a « Déconnecté » row: its email, locked in the form. */
    prefillEmail?: string;
    /** Slot the re-connected session must land back into. */
    slot?: number;
}
export default function AddAccountModal({ open, onClose, prefillEmail, slot }: Props): import("react").JSX.Element;
export {};
