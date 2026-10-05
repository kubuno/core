/**
 * Instance-wide maintenance banner, shown at the top of the shell while a global
 * database operation runs (engine switch, schema-prefix change, restore). It is
 * a persistent Callout, never a fleeting toast, and disappears on its own the
 * moment the operation ends (the notice is lifted over WebSocket or on reload).
 */
export declare function GlobalMaintenanceBanner(): import("react").JSX.Element | null;
/**
 * Per-module maintenance banner, shown at the top of the module area while a
 * database operation scoped to the displayed module runs (its database is being
 * switched, synced or migrated). Disappears automatically when the notice lifts.
 */
export declare function ModuleMaintenanceBanner({ moduleId }: {
    moduleId: string;
}): import("react").JSX.Element | null;
