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
    /** Noms des éléments dans le même dossier (pour détecter les conflits côté client) */
    siblingNames?: string[];
}
export default function RenameModal({ target, onClose, siblingNames }: Props): import("react").JSX.Element | null;
export {};
