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
export declare const ModuleSettingsRegistry: {
    /** Legacy: declare the module's per-user settings route (default `/<moduleId>/settings`).
     *  Kept for modules not yet migrated to the admin/user split. */
    register(moduleId: string, route?: string): void;
    /** Declare the module's admin (instance-wide) settings route. */
    registerAdmin(moduleId: string, route?: string): void;
    /** Declare the module's per-user settings route. */
    registerUser(moduleId: string, route?: string): void;
    /** Per-user settings route for `moduleId` if registered and active, else null.
     *  This is what the header gear button navigates to. */
    getRoute(moduleId: string | undefined, activeIds: Set<string>): string | null;
    /** Admin (instance-wide) settings route for `moduleId` if registered and active. */
    getAdminRoute(moduleId: string | undefined, activeIds: Set<string>): string | null;
    /** Whether `pathname` is a registered settings page (full-bleed, no toolbar). */
    isSettingsRoute(pathname: string): boolean;
};
export interface NotifActivity {
    /** Stable id, unique within the group. */
    id: string;
    /** Human label (already translated; modules pass `t(..., { defaultValue })`). */
    label: string;
    /** Default channel states when the user hasn't chosen yet. */
    emailDefault?: boolean;
    pushDefault?: boolean;
}
export interface NotifGroup {
    /** Owning module ('core' = always shown; others shown only when the module is active). */
    moduleId: string;
    /** Group heading (e.g. "Tâches"). */
    title: string;
    /** Sort order among groups (lower first; default 100). */
    order?: number;
    activities: NotifActivity[];
}
export declare const NotificationRegistry: {
    /** Register (or replace, by moduleId+title) a notification activity group. */
    register(group: NotifGroup): void;
    /** Groups to display: core groups always, module groups only when active. */
    getGroups(activeIds: Set<string>): NotifGroup[];
};
interface SlotProps {
    name: SlotName;
    fallback?: React.ReactNode;
}
export declare function Slot({ name, fallback }: SlotProps): React.JSX.Element;
export {};
