export declare function ResizeHandle({ position, onResize, min, max, onReset, title, }: {
    /** Position (px depuis la gauche) de la jointure = largeur du panneau de gauche. */
    position: number;
    onResize: (width: number) => void;
    min?: number;
    max?: number;
    /** Double-clic → réinitialise (optionnel). */
    onReset?: () => void;
    title?: string;
}): import("react").JSX.Element;
export declare function useResizableWidth(key: string, def: number, min?: number, max?: number): [number, (w: number) => void];
