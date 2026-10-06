import type { RightRail } from './RightRail';
export declare function Part1({ visible, activeModuleId, togglePanel }: {
    visible: NonNullable<RightRail['visible']>;
    activeModuleId: RightRail['activeModuleId'];
    togglePanel: NonNullable<RightRail['togglePanel']>;
}): import("react").JSX.Element;
export declare function Part2({ reopenLabel, reopenEntries, setReopenMenu }: {
    reopenLabel: NonNullable<RightRail['reopenLabel']>;
    reopenEntries: NonNullable<RightRail['reopenEntries']>;
    setReopenMenu: NonNullable<RightRail['setReopenMenu']>;
}): import("react").JSX.Element;
export declare function Part3({ customiseLabel, setEditing }: {
    customiseLabel: NonNullable<RightRail['customiseLabel']>;
    setEditing: NonNullable<RightRail['setEditing']>;
}): import("react").JSX.Element;
export declare function Part4({ reopenEntries, reopen, reopenMenu, setReopenMenu }: {
    reopenEntries: NonNullable<RightRail['reopenEntries']>;
    reopen: RightRail['reopen'];
    reopenMenu: NonNullable<RightRail['reopenMenu']>;
    setReopenMenu: NonNullable<RightRail['setReopenMenu']>;
}): import("react").JSX.Element;
