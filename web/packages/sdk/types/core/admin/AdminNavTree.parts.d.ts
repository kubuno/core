import { type ModuleLiveState } from "./adminModules";
import type { AdminNavTree } from './AdminNavTree';
declare function StateGlyph({ state, title }: {
    state: ModuleLiveState;
    title: string;
}): import("react").JSX.Element | null;
export { StateGlyph };
declare function PinButton({ pinned, offered, label, onToggle }: {
    pinned: boolean;
    offered: boolean;
    label: string;
    onToggle: () => void;
}): import("react").JSX.Element;
export { PinButton };
export declare function Part1({ it, t, activeMeta, It_Icon }: {
    it: NonNullable<AdminNavTree['rows_nav']>[number]['it'];
    t: NonNullable<AdminNavTree['tr']>;
    activeMeta: AdminNavTree['activeMeta'];
    It_Icon: NonNullable<NonNullable<NonNullable<AdminNavTree['rows_nav']>[number]['it']>['Icon']>;
}): import("react").JSX.Element;
export declare function Part2({ meta, indent, rowClass, isActive, caretSpacer, label, LINK_CLASS, TopIcon, t, pins }: {
    meta: NonNullable<AdminNavTree['rows_pinned']>[number]['meta'];
    indent: AdminNavTree['indent'];
    rowClass: AdminNavTree['rowClass'];
    isActive: NonNullable<AdminNavTree['rows_pinned']>[number]['isActive'];
    caretSpacer: NonNullable<AdminNavTree['caretSpacer']>;
    label: NonNullable<AdminNavTree['rows_pinned']>[number]['label'];
    LINK_CLASS: NonNullable<AdminNavTree['LINK_CLASS']>;
    TopIcon: NonNullable<AdminNavTree['rows_pinned']>[number]['TopIcon'];
    t: NonNullable<AdminNavTree['tr']>;
    pins: NonNullable<AdminNavTree['pins']>;
}): import("react").JSX.Element;
export declare function Part3({ showMore, setShowMore, indent, rowClass, CARET_SLOT, caretIcon, t }: {
    showMore: NonNullable<AdminNavTree['showMore']>;
    setShowMore: NonNullable<AdminNavTree['setShowMore']>;
    indent: AdminNavTree['indent'];
    rowClass: AdminNavTree['rowClass'];
    CARET_SLOT: NonNullable<AdminNavTree['CARET_SLOT']>;
    caretIcon: AdminNavTree['caretIcon'];
    t: NonNullable<AdminNavTree['tr']>;
}): import("react").JSX.Element;
export declare function Part4({ indent, t }: {
    indent: AdminNavTree['indent'];
    t: NonNullable<AdminNavTree['tr']>;
}): import("react").JSX.Element;
