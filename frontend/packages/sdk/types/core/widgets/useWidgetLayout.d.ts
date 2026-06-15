import { type WidgetSize } from './WidgetRegistry';
export declare function useWidgetLayout(activeModuleIds: Set<string>): {
    orderedVisible: import("./WidgetRegistry").WidgetDef[];
    hiddenWidgets: import("./WidgetRegistry").WidgetDef[];
    effectiveSize: (id: string, defaultSize?: WidgetSize) => WidgetSize;
    moveWidget: (fromId: string, toId: string) => void;
    reorderWidgets: (newOrder: string[]) => void;
    removeWidget: (id: string) => void;
    addWidget: (id: string) => void;
    setSize: (id: string, size: WidgetSize) => void;
};
