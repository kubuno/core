import { type FileItem, type Folder } from './api';
export type ShareTarget = {
    type: 'file';
    item: FileItem;
} | {
    type: 'folder';
    item: Folder;
};
interface Props {
    target: ShareTarget | null;
    onClose: () => void;
}
export default function ShareModal({ target, onClose }: Props): import("react").JSX.Element | null;
export {};
