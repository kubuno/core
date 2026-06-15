import type React from 'react';
export interface ToolbarConfig {
    moduleId: string;
    routePrefix: string;
    ToolbarComponent?: React.ComponentType;
    noPadding?: boolean;
}
interface ToolbarState {
    configs: ToolbarConfig[];
    register: (config: ToolbarConfig) => void;
    unregister: (moduleId: string) => void;
}
export declare const useToolbarStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ToolbarState>>;
export declare function resolveToolbarConfig(configs: ToolbarConfig[], pathname: string): ToolbarConfig | null;
export {};
