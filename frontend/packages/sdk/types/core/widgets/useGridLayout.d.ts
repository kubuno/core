import { type GridItem, type GridPos } from './gridTypes';
export declare function useGridLayout(activeModuleIds: Set<string>): {
    gridItems: GridItem[];
    hiddenWidgets: import("./WidgetRegistry").WidgetDef[];
    moveWidget: (id: string, newPos: GridPos) => void;
    resizeWidget: (id: string, newPos: GridPos) => void;
    removeWidget: (id: string) => void;
    addWidget: (id: string) => void;
    getConfig: (id: string) => Record<string, unknown>;
    setConfig: (id: string, key: string, value: unknown) => void;
};
