export interface FileTypeDeclaration {
    /** Identité du module/sous-module déclarant (ex. 'office-documents', 'code'). */
    moduleId: string;
    /** Libellé affichable (ex. « Documents »). */
    label: string;
    /** MIME types exacts (ex. 'application/pdf'). */
    mimeTypes?: string[];
    /** Préfixes MIME (ex. 'image/', 'text/'). */
    mimePrefixes?: string[];
    /** Extensions sans point, insensibles à la casse (ex. 'docx', 'odt'). */
    extensions?: string[];
    /** Nom d'icône Lucide pour ce type de fichier (ex. 'Layers'). */
    icon?: string;
    /** Ouvre le fichier dans l'application associée (résout l'entité + navigue). */
    open?: (file: FileOpenTarget, navigate: FileNavigate) => void;
}
export type FileNavigate = (path: string) => void;
export interface FileOpenTarget {
    id: string;
    name: string;
    mime_type: string;
}
export interface FileLike {
    mime_type: string;
    name: string;
}
export declare const FileTypeRegistry: {
    register(d: FileTypeDeclaration): void;
    get(moduleId: string): FileTypeDeclaration | undefined;
    all(): FileTypeDeclaration[];
    /** Le fichier correspond-il à la déclaration du module ? (pas de déclaration → tout passe) */
    matches(moduleId: string, file: FileLike): boolean;
    /** Prédicat de filtrage prêt à l'emploi pour un module. */
    matcher(moduleId: string): (file: FileLike) => boolean;
    /** Modules déclarés capables d'ouvrir ce fichier (pour « ouvrir avec »). */
    handlersFor(file: FileLike): FileTypeDeclaration[];
    /** Déclarations correspondantes qui savent OUVRIR le fichier (handler `open`). */
    openersFor(file: FileLike): FileTypeDeclaration[];
    /** Nom d'icône de l'app associée au fichier (1er match avec icône), sinon undefined. */
    iconFor(file: FileLike): string | undefined;
    /** Chaîne `accept` (MIME + extensions) pour un <input type=file> / upload. */
    acceptString(moduleId: string): string;
};
