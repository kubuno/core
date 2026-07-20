/**
 * Persist the expanded/collapsed state of the left and right panels per
 * application AND per tab (sessionStorage). On reload (F5) or when returning to
 * an application later within the same tab, the last state is restored.
 *
 * First visit of an application (no saved state) falls back to the
 * CollapseSidebarRegistry default for the left panel (some apps auto-collapse to
 * maximise workspace), and a closed right panel.
 */
export declare function usePanelStatePersistence(): void;
