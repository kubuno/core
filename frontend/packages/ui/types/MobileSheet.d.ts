import { type ReactNode } from 'react';
/**
 * Bottom sheet — the mobile stand-in for a popover/dropdown. Anchored popovers
 * assume a mouse and enough room beside the trigger; on a phone the same choices
 * belong in a sheet that slides up from the bottom edge, is thumb-reachable and
 * dismissed by tapping the scrim.
 *
 * Rendered in a portal so it escapes the explorer's scroll/transform context,
 * above the shell's bottom nav (z-40) and FAB.
 */
export declare function MobileSheet({ open, onClose, title, children }: {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    children: ReactNode;
}): import("react").ReactPortal | null;
/** One row inside a sheet. Sized for a thumb (52px), not a cursor. */
export declare function MobileSheetItem({ icon, label, trailing, danger, selected, onClick }: {
    icon?: ReactNode;
    label: ReactNode;
    trailing?: ReactNode;
    danger?: boolean;
    selected?: boolean;
    onClick: () => void;
}): import("react").JSX.Element;
export declare function MobileSheetSeparator(): import("react").JSX.Element;
