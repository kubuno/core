import type React from 'react';
export interface LeftRailEntry {
    moduleId: string;
    icon: React.ComponentType<{
        size?: number;
        className?: string;
    }>;
    label: string;
    isActive?: boolean;
    onClick: () => void;
}
interface LeftRailState {
    entries: LeftRailEntry[];
    registerEntry: (entry: LeftRailEntry) => void;
    unregisterEntry: (moduleId: string) => void;
    updateEntry: (moduleId: string, patch: Partial<LeftRailEntry>) => void;
}
export declare const useLeftRailStore: import("zustand").UseBoundStore<import("zustand").StoreApi<LeftRailState>>;
export {};
