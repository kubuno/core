import { type FileItem, type Folder } from './api';
type Target = {
    type: 'folder';
    item: Folder;
} | {
    type: 'file';
    item: FileItem;
};
interface Props {
    target: Target | null;
    onClose: () => void;
}
export default function MoveModal({ target, onClose }: Props): import("react").JSX.Element | null;
export {};
