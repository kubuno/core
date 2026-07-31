import type React from 'react';
/**
 * Marge intérieure que la zone module (`ModuleArea`) applique au contenu du
 * module. Le shell n'en met AUCUNE par défaut. Trois formes :
 *  - `number`  → px, uniforme (ex. `24`)
 *  - `string`  → raccourci CSS `padding` (ex. `"1.5rem"`, `"1rem 2rem"`, `"0 24px"`)
 *  - objet     → par côté (nombre = px, chaîne = valeur CSS libre)
 * La marge n'entoure QUE le contenu défilant — pas la barre d'outils du module.
 */
export type ModuleAreaPadding = number | string | {
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
};
export interface ToolbarConfig {
    moduleId: string;
    routePrefix: string;
    ToolbarComponent?: React.ComponentType;
    noPadding?: boolean;
    padding?: ModuleAreaPadding;
}
/** Convertit une `ModuleAreaPadding` en style CSS pour `ModuleArea`. */
export declare function moduleAreaPaddingStyle(p: ModuleAreaPadding | undefined): React.CSSProperties | undefined;
interface ToolbarState {
    configs: ToolbarConfig[];
    register: (config: ToolbarConfig) => void;
    unregister: (moduleId: string) => void;
}
export declare const useToolbarStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ToolbarState>>;
export declare function resolveToolbarConfig(configs: ToolbarConfig[], pathname: string): ToolbarConfig | null;
export {};
