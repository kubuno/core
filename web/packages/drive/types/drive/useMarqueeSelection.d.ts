import type React from 'react';
export interface MarqueeStyle {
    position: 'fixed';
    left: number;
    top: number;
    width: number;
    height: number;
}
export declare function useMarqueeSelection(onSelectIds: (ids: Set<string>, additive: boolean) => void): {
    containerRef: React.RefObject<HTMLDivElement | null>;
    marqueeStyle: MarqueeStyle | null;
    preSelectedIds: Set<string>;
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
};
