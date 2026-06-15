import type React from 'react';
export interface SidebarConfig {
    moduleId: string;
    routePrefix: string;
    newButtonLabel?: string;
    newButtonLabelKey?: string;
    NewActions?: React.ComponentType;
    SidebarBody?: React.ComponentType<{
        collapsed?: boolean;
    }>;
    collapsedBody?: boolean;
    hideSidebar?: boolean;
}
interface SidebarState {
    configs: SidebarConfig[];
    register: (config: SidebarConfig) => void;
    unregister: (moduleId: string) => void;
}
export declare const useSidebarStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SidebarState>>;
export declare function resolveActiveSidebarConfig(configs: SidebarConfig[], pathname: string): SidebarConfig | null;
export {};
