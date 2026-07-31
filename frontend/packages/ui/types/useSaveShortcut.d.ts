type SaveHandler = () => void;
/**
 * Runs `onSave` on Ctrl+S (⌘S on macOS), immediately.
 *
 * `enabled` is for consumers whose save is conditional (nothing to save, read-only
 * document): pass false and the shortcut falls through to whatever is below in the
 * stack rather than firing a no-op.
 */
export declare function useSaveShortcut(onSave: SaveHandler, enabled?: boolean): void;
export {};
