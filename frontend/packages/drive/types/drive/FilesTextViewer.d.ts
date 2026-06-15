/** Le fichier est-il consultable comme du texte ? (MIME `text/*`, MIME texte connu, ou extension.) */
export declare function isTextFile(file: {
    name: string;
    mime_type: string;
}): boolean;
interface Props {
    name: string;
    load: () => Promise<Blob>;
    onClose: () => void;
}
export default function FilesTextViewer({ name, load, onClose }: Props): import("react").JSX.Element;
export {};
