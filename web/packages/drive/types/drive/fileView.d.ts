export type ViewMode = 'lg' | 'sm' | 'list' | 'details';
export interface ViewSpec {
    kind: 'icons' | 'rows';
    min?: number;
    thumbH?: number;
    iconScale?: number;
    dense?: boolean;
    multicol?: boolean;
    density?: 'compact' | 'normal';
}
export declare const VIEW_SPECS: Record<ViewMode, ViewSpec>;
interface ViewMenuProps {
    value: ViewMode;
    onChange: (v: ViewMode) => void;
    showHidden: boolean;
    onShowHidden: (v: boolean) => void;
    /** Traducteur (namespace 'files') — `t(key, { defaultValue })`. */
    t: (key: string, opts?: Record<string, unknown>) => string;
}
export declare function ViewMenu({ value, onChange, showHidden, onShowHidden, t }: ViewMenuProps): import("react").JSX.Element;
export {};
