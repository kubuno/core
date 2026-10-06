export interface AvatarCrop {
    zoom: number;
    ox: number;
    oy: number;
}
interface Props {
    /** Image initiale à recadrer (avatar actuel ou null). */
    initialSrc?: string | null;
    /** Paramètres de recadrage précédents (restaurés sur l'image initiale). */
    initialCrop?: AvatarCrop | null;
    saving?: boolean;
    onCancel: () => void;
    /** `original` = fichier nouvellement importé (à conserver côté serveur), sinon null. */
    onSave: (cropped: Blob, original: File | null, crop: AvatarCrop) => void;
}
export default function AvatarCropModal({ initialSrc, initialCrop, saving, onCancel, onSave }: Props): import("react").JSX.Element;
export {};
