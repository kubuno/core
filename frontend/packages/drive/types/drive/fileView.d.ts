export type ViewMode = 'xl' | 'lg' | 'md' | 'sm' | 'list' | 'details' | 'tiles' | 'content';
export interface ViewSpec {
    kind: 'icons' | 'tiles' | 'rows';
    min?: number;
    thumbH?: number;
    iconScale?: number;
    dense?: boolean;
    multicol?: boolean;
    density?: 'compact' | 'normal' | 'large';
}
export declare const VIEW_SPECS: Record<ViewMode, ViewSpec>;
interface ViewMenuProps {
    value: ViewMode;
    onChange: (v: ViewMode) => void;
    compact: boolean;
    onCompact: (v: boolean) => void;
    showHidden: boolean;
    onShowHidden: (v: boolean) => void;
    /** Traducteur (namespace 'files') — `t(key, { defaultValue })`. */
    t: (key: string, opts?: Record<string, unknown>) => string;
}
export declare function ViewMenu({ value, onChange, compact, onCompact, showHidden, onShowHidden, t }: ViewMenuProps): import("react").JSX.Element;
export {};
