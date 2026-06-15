import { type FileItem, type Folder } from './api';
export type InfoTarget = {
    type: 'file';
    item: FileItem;
} | {
    type: 'folder';
    item: Folder;
};
interface Props {
    target: InfoTarget | null;
    onClose: () => void;
}
export default function FileInfoModal({ target, onClose }: Props): import("react").JSX.Element | null;
export {};
