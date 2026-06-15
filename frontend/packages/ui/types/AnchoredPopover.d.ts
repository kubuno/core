import { type ReactNode, type RefObject } from 'react';
export declare function AnchoredPopover({ anchorRef, open, onClose, children, gap, align, }: {
    anchorRef: RefObject<HTMLElement | null>;
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    gap?: number;
    align?: 'left' | 'right';
}): import("react").ReactPortal | null;
