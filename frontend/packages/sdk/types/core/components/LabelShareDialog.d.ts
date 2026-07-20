import { type CoreLabel } from '../api/labels';
interface Props {
    label: CoreLabel;
    onClose: () => void;
    onSaved: () => void;
}
export default function LabelShareDialog({ label, onClose, onSaved }: Props): import("react").JSX.Element;
export {};
