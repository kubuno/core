interface Position {
    x: number;
    y: number;
}
export declare function useDraggable(initialPos?: Position): {
    dialogRef: import("react").RefObject<HTMLDivElement | null>;
    startDrag: (e: React.MouseEvent) => void;
};
export {};
