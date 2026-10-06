import type { RightPanel } from './RightPanel';
export declare function Part1({ overlay, dragging, isOpen, width, activeEntry, t, onResizeDown, onResizeMove, endResize, applyWidth, appId, navigate, chromeBtn, closePanel }: {
    overlay: NonNullable<RightPanel['overlay']>;
    dragging: NonNullable<RightPanel['dragging']>;
    isOpen: NonNullable<RightPanel['isOpen']>;
    width: NonNullable<RightPanel['width']>;
    activeEntry: NonNullable<RightPanel['activeEntry']>;
    t: NonNullable<RightPanel['tr']>;
    onResizeDown: NonNullable<RightPanel['onResizeDown']>;
    onResizeMove: NonNullable<RightPanel['onResizeMove']>;
    endResize: NonNullable<RightPanel['endResize']>;
    applyWidth: NonNullable<RightPanel['applyWidth']>;
    appId: NonNullable<RightPanel['appId']>;
    navigate: NonNullable<RightPanel['navigate']>;
    chromeBtn: NonNullable<RightPanel['chromeBtn']>;
    closePanel: NonNullable<RightPanel['closePanel']>;
}): import("react").JSX.Element;
