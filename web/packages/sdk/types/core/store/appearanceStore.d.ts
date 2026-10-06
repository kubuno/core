export type AppearanceMode = 'light' | 'dark' | 'system';
export interface ModuleAppearance {
    mode: AppearanceMode;
    /** Colour scheme id — modules/themes may honour it via [data-kb-scheme]. */
    scheme: string;
    /** Information density — honoured via [data-kb-density]. */
    density: string;
}
export declare const APPEARANCE_DEFAULT: ModuleAppearance;
export declare const APPEARANCE_SCHEMES: readonly ["modern", "classic", "high-contrast"];
export declare const APPEARANCE_DENSITIES: readonly ["responsive", "comfortable", "compact"];
interface AppearanceState {
    byModule: Record<string, ModuleAppearance>;
    get: (moduleId: string) => ModuleAppearance;
    set: (moduleId: string, patch: Partial<ModuleAppearance>) => void;
}
export declare const useAppearanceStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AppearanceState>>;
export {};
