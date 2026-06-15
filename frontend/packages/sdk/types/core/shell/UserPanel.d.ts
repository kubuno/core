interface Props {
    open: boolean;
    onClose: () => void;
    onAddAccount: () => void;
    anchorRef: React.RefObject<HTMLElement | null>;
}
export default function UserPanel({ open, onClose, onAddAccount, anchorRef }: Props): import("react").JSX.Element | null;
export {};
