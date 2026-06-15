export interface BatchRenameItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
}
interface Props {
    items: BatchRenameItem[];
    onClose: () => void;
}
export default function BatchRenameModal({ items, onClose }: Props): import("react").JSX.Element;
export {};
