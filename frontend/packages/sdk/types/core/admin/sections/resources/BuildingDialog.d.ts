import { type Building } from './api';
export default function BuildingDialog({ building, floorMax, onClose, }: {
    /** `null` opens an empty sheet. */
    building: Building | null;
    floorMax: number;
    onClose: () => void;
}): import("react").JSX.Element;
