export interface ThemeDef {
    id: string;
    name: string;
    color_scheme: 'light' | 'dark' | string;
    vars: Record<string, string>;
    builtin?: boolean;
}
interface ThemeState {
    themes: ThemeDef[];
    activeThemeId: string;
    isLoaded: boolean;
    fetchThemes: () => Promise<void>;
    applyTheme: (id: string) => void;
}
export declare const useThemeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ThemeState>>;
export {};
