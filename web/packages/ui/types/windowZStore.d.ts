interface State {
    counter: number;
    next: () => number;
}
export declare const useWindowZStore: import("zustand").UseBoundStore<import("zustand").StoreApi<State>>;
export {};
