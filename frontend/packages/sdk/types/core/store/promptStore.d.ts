import type { PromptOptions } from '@ui/PromptDialog';
interface PromptEntry extends PromptOptions {
    resolve: (value: string | null) => void;
}
interface PromptStore {
    current: PromptEntry | null;
    open: (options: PromptOptions) => Promise<string | null>;
    confirm: (value: string) => void;
    cancel: () => void;
}
export declare const usePromptStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PromptStore>>;
/**
 * Remplaçant impératif de `window.prompt`, basé sur la primitive PromptDialog du core.
 * Résout avec la valeur saisie, ou `null` si l'utilisateur annule.
 * Nécessite `<PromptHost />` monté une fois dans l'arbre (cf. App.tsx).
 */
export declare const prompt: (options: PromptOptions) => Promise<string | null>;
export {};
