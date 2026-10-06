/** How many pages may be pinned. Past five the list stops being a shortcut. */
export declare const PIN_LIMIT = 5;
export interface AdminPins {
    /** Pinned tab ids, in the order they were pinned. */
    pins: string[];
    isPinned: (tab: string) => boolean;
    /** Pins an unpinned tab (unless the list is full) or unpins a pinned one. */
    toggle: (tab: string) => void;
    /** False once the list is full — the pin control is then offered on pinned rows only. */
    canPin: boolean;
}
/**
 * The pins of the signed-in account, as state.
 *
 * Meant for ONE mount (the navigation tree): the value is held in component
 * state rather than in a store, so nothing else can hold a stale copy of it.
 */
export declare function useAdminPins(): AdminPins;
