export declare function useProgressiveWindow({ totalItems, resetKey, containerRef, isLoading, rootResolved }: {
    totalItems: number;
    /** Changing it restarts the window from the top (navigation, sort, filter). */
    resetKey: string;
    containerRef: React.RefObject<HTMLDivElement | null>;
    isLoading: boolean;
    rootResolved: boolean;
}): {
    visibleCount: number;
    hasMore: boolean;
    loadSentinelRef: import("react").RefObject<HTMLDivElement | null>;
};
