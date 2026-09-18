interface Props {
    open: boolean;
    onClose: () => void;
    /** Opens the add-account modal; `prefill` re-connects a « Déconnecté » row. */
    onAddAccount: (prefill?: {
        email: string;
        slot: number;
    }) => void;
    anchorRef: React.RefObject<HTMLElement | null>;
}
export default function UserPanel({ open, onClose, onAddAccount, anchorRef }: Props): import("react").ReactPortal | null;
export {};
