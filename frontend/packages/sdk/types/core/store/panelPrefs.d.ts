export declare const SIDEBAR_WIDTH: {
    readonly MIN: 256;
    readonly MAX: 360;
    readonly DEFAULT: 256;
};
export interface AppPanelPrefs {
    /** Left sidebar collapsed. */
    left?: boolean;
    /** Right panel: id of the open module panel, or `null` when closed. */
    right?: string | null;
    /** Left sidebar width in px (expanded state), clamped to SIDEBAR_WIDTH bounds. */
    width?: number;
}
/** Identify the current "application" by the first path segment ('home' for '/'). */
export declare function appIdFromPath(pathname: string): string;
export declare const panelPrefs: {
    get(appId: string): AppPanelPrefs;
    setLeft(appId: string, collapsed: boolean): void;
    setRight(appId: string, moduleId: string | null): void;
    setWidth(appId: string, width: number): void;
};
