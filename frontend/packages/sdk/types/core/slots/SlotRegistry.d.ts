import React from 'react';
export type SlotName = 'sidebar-new-actions' | 'topbar-actions' | 'settings-sections' | 'admin-panels' | 'search-providers' | 'user-menu-items' | 'dashboard-widgets' | 'dashboard-stats-cards' | 'context-menu-items' | 'sidebar-storage' | 'help-menu-items' | 'header-search' | 'header-actions-right' | 'sidebar-footer' | 'module-toolbar' | 'left-rail-icons' | 'right-rail-icons' | 'app-dialogs' | 'global-services' | (string & Record<never, never>);
interface SlotEntry {
    moduleId: string;
    Component: React.ComponentType;
    /** Prédicat optionnel d'applicabilité. Quand il est fourni, le consommateur du
     *  slot peut filtrer les contributeurs qui ne s'appliquent pas à un contexte
     *  donné (ex. « files-open-with » : ne garder que les modules capables d'ouvrir
     *  le fichier visé). L'argument est défini par le consommateur du slot. */
    match?: (arg?: unknown) => boolean;
}
export declare const SlotRegistry: {
    register(slot: SlotName, moduleId: string, Component: React.ComponentType, match?: (arg?: unknown) => boolean): void;
    getSlot(slot: SlotName): SlotEntry[];
    registerOverride(key: string, moduleId: string, Component: React.ComponentType<any>): void;
    getActiveOverride<T = Record<string, unknown>>(key: string, activeIds: Set<string>): React.ComponentType<T> | null;
    unregisterModule(moduleId: string): void;
};
interface SlotProps {
    name: SlotName;
    fallback?: React.ReactNode;
}
export declare function Slot({ name, fallback }: SlotProps): React.JSX.Element;
export {};
