/**
 * Code-behind of `ProvenanceLine.kbview` (converted from `ProvenanceLine.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type MenuItem } from "@ui";
import type { ResolvedSetting, ScopeType } from "./scopeTypes";
import { ViewBase } from './ProvenanceLine.kbview';
import * as __parts from './ProvenanceLine.parts';
export declare function scopeLabel(t: (k: string, o?: Record<string, unknown>) => string, scopeType: ScopeType | undefined, name: string | null | undefined): string;
export type ProvenanceLineProps = {
    setting: ResolvedSetting;
    onRevert: () => void;
    onLock: (locked: boolean) => void;
    onShowChain: () => void;
};
export declare class ProvenanceLine extends ViewBase {
    tr: ProvenanceLineStores['t'];
    menu: ProvenanceLineStores['menu'];
    theme: ProvenanceLineStores['theme'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        menu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
        theme: import("@ui").MenuTheme;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get locked(): boolean;
    get own(): boolean;
    get fromName(): string;
    get lockName(): string;
    get items(): MenuItem[];
    get show_not_locked(): boolean;
    get show_not_own(): boolean;
    get visible(): boolean;
    get visible2(): boolean;
    get show_setting_overrides(): boolean;
    get show_menu_pos(): boolean;
    get part1_props(): {
        items: MenuItem[];
        menu_pos: import("@ui").MenuDropdownPos;
        menu: {
            pos: import("@ui").MenuDropdownPos | null;
            open: (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => void;
            openAt: (x: number, y: number) => void;
            close: () => void;
            isOpen: boolean;
        };
        theme: import("@ui").MenuTheme;
    };
    /** A part of the screen still written in React (<ContextMenu> pos, onClose, theme: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
    panel_click2(_sender: unknown, args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ProvenanceLineStores = ReturnType<ProvenanceLine['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<ProvenanceLineProps>>;
export default _default;
