import { type DetectorLimits } from './api';
interface Props {
    /** `null` creates a new detector. */
    id: string | null;
    limits?: DetectorLimits;
    onClose: () => void;
}
export default function DetectorEditor({ id, limits, onClose }: Props): import("react").JSX.Element;
export {};
