import type React from 'react';
export interface ModuleMenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onSelect: () => void;
    /** Lower comes first within the custom section. */
    order?: number;
}
export interface ModuleMenuConfig {
    /** Presence adds a "Corbeille" entry (the module supports deletions). Navigates to
     *  `route`, or calls `onOpen` for an in-app trash view. */
    trash?: {
        route?: string;
        onOpen?: () => void;
    };
    /** Rich in-app print preview. Absent → the core falls back to `window.print()`
     *  (browser preview using the app's `@media print` rules). */
    print?: {
        onOpen: () => void;
    };
    /** Extra items injected between "Imprimer" and the download entry. */
    items?: ModuleMenuItem[];
}
export declare const ModuleMenuRegistry: {
    register(moduleId: string, config: ModuleMenuConfig): void;
    get(moduleId: string): ModuleMenuConfig | undefined;
    unregisterModule(moduleId: string): void;
};
