import type { ReactNode, CSSProperties } from 'react';
export type PanelId = string;
export type DockSideKey = 'left' | 'right' | 'float';
export interface DockGroup {
    id: string;
    panels: PanelId[];
    active: PanelId;
    x?: number;
    y?: number;
    h?: number;
    rolled?: boolean;
    max?: boolean;
}
export interface DockLayout {
    left: DockGroup[];
    right: DockGroup[];
    float: DockGroup[];
    leftW?: number;
    rightW?: number;
    closed?: PanelId[];
}
export type DropTarget = {
    type: 'tabs';
    side: DockSideKey;
    gid: string;
} | {
    type: 'split';
    side: 'left' | 'right';
    gid: string;
    where: 'top' | 'bottom';
} | {
    type: 'newcol';
    side: 'left' | 'right';
} | {
    type: 'float';
    x: number;
    y: number;
};
export type DockPanel = {
    label: ReactNode;
    render: () => ReactNode;
};
export type DockController = {
    activate: (id: PanelId) => void;
    reset: () => void;
    open: (id: PanelId) => void;
    close: (id: PanelId) => void;
};
export type DockTheme = {
    panel: string;
    header: string;
    border: string;
    text: string;
    textDim: string;
    accent?: string;
};
export declare function DockArea({ panels, storageKey, defaultArrangement, viewportBg, hidden, theme, moveTitle, children, className, style, viewportRef, controllerRef, }: {
    panels: Record<string, DockPanel>;
    storageKey: string;
    defaultArrangement: {
        left?: PanelId[][];
        right?: PanelId[][];
        float?: PanelId[][];
    };
    viewportBg?: string;
    hidden?: boolean;
    theme?: DockTheme;
    moveTitle?: string;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    viewportRef?: React.Ref<HTMLDivElement>;
    controllerRef?: React.MutableRefObject<DockController | null>;
}): import("react").JSX.Element;
