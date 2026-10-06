import type { PanelCard } from './PanelCard';
export declare function Part1({ Icon }: {
    Icon: NonNullable<PanelCard['Icon']>;
}): import("react").JSX.Element;
export declare function Part2({ t, onMove, canMoveUp }: {
    t: NonNullable<PanelCard['tr']>;
    onMove: NonNullable<PanelCard['props']['onMove']>;
    canMoveUp: NonNullable<PanelCard['props']['canMoveUp']>;
}): import("react").JSX.Element;
export declare function Part3({ t, onMove, canMoveDown }: {
    t: NonNullable<PanelCard['tr']>;
    onMove: NonNullable<PanelCard['props']['onMove']>;
    canMoveDown: NonNullable<PanelCard['props']['canMoveDown']>;
}): import("react").JSX.Element;
export declare function Part4({ t, onHide }: {
    t: NonNullable<PanelCard['tr']>;
    onHide: NonNullable<PanelCard['props']['onHide']>;
}): import("react").JSX.Element;
export declare function Part5({ DeltaIcon }: {
    DeltaIcon: NonNullable<PanelCard['DeltaIcon']>;
}): import("react").JSX.Element;
