import type React from 'react';
export interface RailEntry {
    moduleId: string;
    icon: React.ComponentType<{
        size?: number;
        className?: string;
    }>;
    label: string;
    panelComponent: React.ComponentType;
    openPath?: string;
}
interface RightPanelState {
    entries: RailEntry[];
    activeModuleId: string | null;
    registerEntry: (entry: RailEntry) => void;
    unregisterEntry: (moduleId: string) => void;
    togglePanel: (moduleId: string) => void;
    closePanel: () => void;
}
export declare const useRightPanelStore: import("zustand").UseBoundStore<import("zustand").StoreApi<RightPanelState>>;
export {};
