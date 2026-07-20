/** A CSS/JS pair a theme provides, globally or for a targeted module. */
export interface ThemeAsset {
    css?: string;
    script?: string;
}
export interface ThemeDef {
    id: string;
    name: string;
    color_scheme: 'light' | 'dark' | string;
    version?: string;
    theme_api_version?: number;
    vars: Record<string, string>;
    /** Global skin (applies everywhere). */
    global?: ThemeAsset;
    /** Per-module skins — only the listed modules are affected. */
    modules?: Record<string, ThemeAsset>;
    builtin?: boolean;
    /** True if the bundle ships JS overrides. */
    has_scripts?: boolean;
    /** True if the admin trusts this theme to run its JS. */
    scripts_enabled?: boolean;
    /** Base URL for bundled assets, e.g. `/api/v1/themes/<id>`. */
    assets_base?: string;
}
interface ThemeState {
    themes: ThemeDef[];
    activeThemeId: string;
    isLoaded: boolean;
    fetchThemes: () => Promise<void>;
    applyTheme: (id: string) => void;
    /** Inject the active theme's overrides for a module that just loaded. */
    applyThemeModuleAssets: (moduleId: string) => void;
    /** Load a theme's component overrides into the ISOLATED preview scope (admin
     *  pane) without applying it to the live app. Only loads JS for trusted themes. */
    loadThemePreview: (theme: ThemeDef) => void;
    clearThemePreview: () => void;
}
export declare const useThemeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ThemeState>>;
export {};
