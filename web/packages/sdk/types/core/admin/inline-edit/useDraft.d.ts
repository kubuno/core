export interface Draft<T extends Record<string, unknown>> {
    /** What the fields currently show. */
    value: T;
    /** Sets one field. */
    set: <K extends keyof T>(key: K, next: T[K]) => void;
    /** Back to the record — what Cancel does, and what entering edit mode does. */
    reset: (to?: T) => void;
    /** Only the fields that differ from the record. Empty when nothing moved. */
    changed: Partial<T>;
    /** `changed` is not empty. */
    dirty: boolean;
}
/**
 * @param initial the values held by the record — recomputed on every render from
 *        the query data, so a refetch that changes the record also changes what
 *        "unchanged" means.
 */
export declare function useDraft<T extends Record<string, unknown>>(initial: T): Draft<T>;
