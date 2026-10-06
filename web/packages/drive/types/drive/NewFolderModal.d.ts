interface Props {
    open: boolean;
    onClose: () => void;
    parentId: string | null;
}
export default function NewFolderModal({ open, onClose, parentId }: Props): import("react").JSX.Element | null;
export {};
