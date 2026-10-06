import type { ImagePickResult } from '../store/imagePickerStore';
export default function ImagePickerDialog({ title, exclude, multiple, onPick, onCancel }: {
    title?: string;
    exclude?: string[];
    multiple?: boolean;
    onPick: (r: ImagePickResult | ImagePickResult[]) => void;
    onCancel: () => void;
}): import("react").JSX.Element;
