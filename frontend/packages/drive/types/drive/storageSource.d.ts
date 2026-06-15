/**
 * `StorageSource` — abstraction d'un backend de stockage pour l'explorateur de
 * fichiers générique (`StorageExplorer`). UNE seule zone d'exploration (barre de
 * sélection, tri/type/affichage, dossiers/fichiers, menu contextuel) est partagée
 * par TOUS les types de stockage ; chaque source déclare ses **capacités** et la
 * personnalisation se fait en masquant les fonctions non supportées.
 *
 * Le rendu manipule les types existants `Folder`/`FileItem`. Le modèle local est
 * basé sur des UUID (`id`) ; le modèle distant est basé sur des chemins → on adapte
 * `RemoteEntry → Folder/FileItem` avec `id = chemin`. Seules les **opérations**
 * diffèrent : elles passent par `source.*` (où `id` vaut le chemin en distant).
 */
import { type Folder, type FileItem } from './api';
import { getFileIcon } from './filesShared';
export interface StorageCapabilities {
    upload: boolean;
    mkdir: boolean;
    rename: boolean;
    move: boolean;
    copy: boolean;
    trash: boolean;
    delete: boolean;
    star: boolean;
    share: boolean;
    getLink: boolean;
    versions: boolean;
    color: boolean;
    compress: boolean;
    decompress: boolean;
    info: boolean;
    search: boolean;
    openWith: boolean;
    /** Modales riches (NewFolder/Rename/Move/Share/Info/Versions) pour le local ;
     *  flux par `prompt()`/glisser pour le distant. */
    richModals: boolean;
    thumbnails: 'url' | 'blob' | 'none';
}
export type EntryKind = 'file' | 'folder';
export interface ItemRef {
    id: string;
    type: EntryKind;
    name: string;
}
export interface ThumbSpec {
    kind: 'url' | 'blob' | 'none';
    url?: string;
    load?: () => Promise<Blob | null>;
}
export interface StorageSource {
    /** Namespace de cache React-Query (ex. 'local', `remote:${mountId}`). */
    key: string;
    capabilities: StorageCapabilities;
    /** Racine de navigation : `{ id, name }` (id null = racine utilisateur locale). */
    resolveRoot(): Promise<{
        id: string | null;
        name: string;
    } | null>;
    /** Liste un dossier (par id local, ou par chemin distant). */
    list(parentId: string | null): Promise<{
        folders: Folder[];
        files: FileItem[];
    }>;
    /** Ancêtres d'un dossier (du plus haut au dossier lui-même ; [] à la racine).
     *  Sert à reconstruire le fil d'Ariane lors d'une navigation pilotée par l'URL. */
    resolveAncestors(id: string | null): Promise<Array<{
        id: string;
        name: string;
    }>>;
    createFolder(name: string, parentId: string | null): Promise<void>;
    rename(item: ItemRef, newName: string): Promise<void>;
    move(item: ItemRef, targetParentId: string | null): Promise<void>;
    copy(item: ItemRef, targetParentId: string | null): Promise<void>;
    trash(items: ItemRef[]): Promise<void>;
    remove(items: ItemRef[]): Promise<void>;
    uploadFile(file: File, parentId: string | null, onProgress?: (pct: number) => void, overwrite?: boolean): Promise<{
        id: string;
    } | null>;
    star?(item: ItemRef): Promise<void>;
    setFolderColor?(id: string, color: string | null): Promise<void>;
    /** Déclenche le téléchargement navigateur de l'élément. */
    download(item: ItemRef): void | Promise<void>;
    /** Spécifie comment afficher la miniature d'un fichier. */
    thumbnail(file: FileItem): ThumbSpec;
    /** Spécifie comment récupérer le CONTENU complet d'un fichier (visionneuses). */
    content(file: FileItem): ThumbSpec;
    /** Matérialise un fichier dans le stockage LOCAL (pour « ouvrir avec » un
     *  éditeur qui n'accepte qu'un fichier local). Renvoie le FileItem local. */
    materialize?(file: FileItem): Promise<FileItem | null>;
    /** Lit le contenu brut d'un fichier (pour les transferts inter-sources). */
    readBlob(ref: {
        id: string;
        name: string;
    }): Promise<Blob>;
}
/** Copie/déplace un élément d'une source vers une autre (local↔distant, distant↔
 *  distant, …). Récursif pour les dossiers. Utilisé par la vue double-volet. */
export declare function transferItem(from: StorageSource, to: StorageSource, item: ItemRef, toParentId: string | null, mode: 'copy' | 'move'): Promise<void>;
export interface LocalSourceOpts {
    /** Préfixe de dossier racine (ex. "Office/Documents") pour les modules. */
    rootPrefix?: string;
    /** Libellé racine (Mon Drive par défaut). */
    rootName?: string;
}
/** Marche vers le dossier racine d'un préfixe "A/B/C" (réutilisé par les modules). */
export declare function resolveRootFolder(pathPrefix: string): Promise<Folder | null>;
export declare function localSource(opts?: LocalSourceOpts): StorageSource;
export declare function remoteSource(mountId: string, mountName: string): StorageSource;
/** Icône par défaut d'un fichier (réexport pratique pour les sources). */
export { getFileIcon };
export declare function systemSource(): StorageSource;
