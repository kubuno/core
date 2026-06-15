import { FileItem } from './api';
interface Props {
    file: FileItem | null;
    onClose: () => void;
}
export default function VersionHistoryModal({ file, onClose }: Props): import("react").JSX.Element | null;
export {};
