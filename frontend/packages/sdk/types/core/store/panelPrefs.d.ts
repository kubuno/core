export interface AppPanelPrefs {
    /** Left sidebar collapsed. */
    left?: boolean;
    /** Right panel: id of the open module panel, or `null` when closed. */
    right?: string | null;
}
/** Identify the current "application" by the first path segment ('home' for '/'). */
export declare function appIdFromPath(pathname: string): string;
export declare const panelPrefs: {
    get(appId: string): AppPanelPrefs;
    setLeft(appId: string, collapsed: boolean): void;
    setRight(appId: string, moduleId: string | null): void;
};
