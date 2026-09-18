import { type FileItem, type Folder } from './api';
export type InfoTarget = {
    type: 'file';
    item: FileItem;
} | {
    type: 'folder';
    item: Folder;
};
/** Cible courante de la fenêtre d'informations, exposée aux contributeurs de slot.
 *  Le module Drive injecte par ex. une section « Étiquettes » via le slot
 *  'files-info-extra' en lisant ce contexte. */
export interface FileInfoExtraTarget {
    kind: 'file' | 'folder';
    id: string;
    name: string;
}
export declare const FileInfoExtraContext: import("react").Context<FileInfoExtraTarget | null>;
type TF = (key: string, opts?: Record<string, unknown>) => string;
export declare function mimeLabel(mimeType: string, name: string | undefined, t: TF): string;
interface Props {
    target: InfoTarget | null;
    onClose: () => void;
}
export declare function FileInfoContent({ target }: {
    target: NonNullable<Props['target']>;
}): import("react").JSX.Element | null;
/** The details window. Kept for the search view until `@kubuno/drive` is
 *  republished with `FileInfoContent`; the explorer uses the side panel. */
export default function FileInfoModal({ target, onClose }: Props): import("react").JSX.Element | null;
export {};
