import type React from 'react';
export interface SearchConfig {
    moduleId: string;
    routePrefix: string;
    placeholder: string;
    placeholderKey?: string;
    onSearch?: (query: string) => void;
    SearchComponent?: React.ComponentType;
    FilterPanel?: React.ComponentType<{
        onClose: () => void;
    }>;
    onImageSearch?: (file: File) => void;
    inline?: boolean;
}
interface SearchState {
    configs: SearchConfig[];
    query: string;
    setQuery: (q: string) => void;
    register: (config: SearchConfig) => void;
    unregister: (moduleId: string) => void;
}
export declare const useSearchStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SearchState>>;
export declare function resolveSearchConfig(configs: SearchConfig[], pathname: string): SearchConfig | null;
export {};
