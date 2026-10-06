/**
 * Code-behind of `RightPanel.kbview` (converted from `RightPanel.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './RightPanel.kbview';
import * as __parts from './RightPanel.parts';
export declare class RightPanel extends ViewBase {
    accessor dragging: boolean;
    tr: RightPanelStores['t'];
    entries: RightPanelStores['entries'];
    activeModuleId: string | null;
    closePanel: () => void;
    navigate: RightPanelStores['navigate'];
    pathname: string;
    width: number;
    setWidth: RightPanelStores['setWidth'];
    drag: RightPanelStores['drag'];
    applyWidth: (next: number) => void;
    onResizeDown: (e: React.PointerEvent) => void;
    onResizeMove: (e: React.PointerEvent) => void;
    endResize: (e: React.PointerEvent) => void;
    overlay: RightPanelStores['overlay'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        entries: import("../store/rightPanelStore").RailEntry[];
        activeModuleId: string | null;
        closePanel: () => void;
        navigate: import("react-router").NavigateFunction;
        pathname: string;
        width: number;
        setWidth: import("react").Dispatch<import("react").SetStateAction<number>>;
        drag: import("react").RefObject<{
            x: number;
            w: number;
        } | null>;
        applyWidth: (next: number) => void;
        onResizeMove: (e: React.PointerEvent) => void;
        overlay: boolean;
        setOverlay: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        onResizeDown: (e: React.PointerEvent) => void;
        endResize: (e: React.PointerEvent) => void;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get appId(): string;
    get activeEntry(): import("../store/rightPanelStore").RailEntry | undefined;
    get isOpen(): boolean;
    get chromeBtn(): string;
    get show_is_open_overlay(): boolean;
    get part1_props(): {
        overlay: boolean;
        dragging: boolean;
        isOpen: boolean;
        width: number;
        activeEntry: import("../store/rightPanelStore").RailEntry | undefined;
        t: import("i18next").TFunction<"translation", undefined>;
        onResizeDown: (e: React.PointerEvent) => void;
        onResizeMove: (e: React.PointerEvent) => void;
        endResize: (e: React.PointerEvent) => void;
        applyWidth: (next: number) => void;
        appId: string;
        navigate: import("react-router").NavigateFunction;
        chromeBtn: string;
        closePanel: () => void;
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part1(): typeof __parts.Part1;
    panel_click(_sender: unknown, _args: MouseEventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RightPanelStores = ReturnType<RightPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type RightPanelHooks = ReturnType<RightPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
