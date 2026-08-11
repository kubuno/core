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
/**
 * A request from a module to the SHELL to open (or close) its search surface.
 *
 * The shell owns the magnifier and the search mode it expands into, so a module
 * cannot open it by itself — and its own search component is not even mounted
 * while the mode is closed, which is exactly when a global shortcut has to work.
 * `seq` makes each request distinct, so asking twice in a row is honoured twice.
 */
export interface SearchOpenSignal {
    seq: number;
    open: boolean;
}
interface SearchState {
    configs: SearchConfig[];
    query: string;
    setQuery: (q: string) => void;
    /** Latest open/close request. `seq: 0` = nothing asked yet. */
    openSignal: SearchOpenSignal;
    /** Ask the shell to enter (or leave) search mode. */
    requestSearchOpen: (open: boolean) => void;
    register: (config: SearchConfig) => void;
    unregister: (moduleId: string) => void;
}
export declare const useSearchStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SearchState>>;
export declare function resolveSearchConfig(configs: SearchConfig[], pathname: string): SearchConfig | null;
export {};
