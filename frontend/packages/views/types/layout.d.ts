/**
 * The layout containers of `.kbview` web views (VIEWS-SPEC §5, lot WV-5a): `UserControl` (the root of a
 * `.kbcontrol`), `Panel` (dock bands, or absolute placement with `Layout="Absolute"`), `Stack` (flow along a
 * direction) and `ScrollArea` (one scrolling child).
 *
 * They live in the runtime, not in `@ui`, because a dock container reads its children's attached layout
 * values (`Dock`, `X`, `Y`…) from the plan: the renderer gives every element of `@kubuno/views` its view
 * (`__view`) and element id (`__id`).
 *
 * Web rendering of a clickable container: `AccessibleRole="PushButton"` renders a native `<button>` and a
 * web-only `Href` renders a link (`<a href>`); either keeps the keyboard and screen-reader behaviour of the
 * native element. A plain left click on a link stays in the app (the view's `OnClick` decides where to go);
 * a modified or middle click opens the address like any link.
 */
import { type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import type { Internals } from './view';
/** The theme surfaces a container may paint (VIEWS-SPEC §4.1: tokens only). */
export type Surface = 'None' | 'Layer' | 'Card' | 'Raised' | 'Well';
/** What every container receives besides its own properties. */
interface ContainerBase {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** `Enabled="false"`: a native button is disabled, another container made inert. */
    disabled?: boolean;
    tabIndex?: number;
    'aria-label'?: string;
    role?: string;
    href?: string;
    onClick?: (e: ReactMouseEvent<HTMLElement>) => void;
    surface?: Surface;
    /** @internal — given by the renderer to every element of `@kubuno/views`. */
    __view?: Internals;
    /** @internal */
    __id?: string;
}
export type DockValue = 'None' | 'Top' | 'Bottom' | 'Left' | 'Right' | 'Fill';
/** Where a docked child goes in the dock grid: `[rowStart, rowEnd, colStart, colEnd]` (1-based lines). */
export interface DockPlacement {
    readonly row: readonly [number, number];
    readonly col: readonly [number, number];
}
export interface DockGrid {
    /** `grid-template-rows` / `-columns`. */
    readonly rows: string;
    readonly columns: string;
    readonly placements: readonly DockPlacement[];
}
/**
 * The CSS grid of a dock layout (WinForms semantics: each docked child, in document order, takes a band
 * along one edge of the room the previous ones left; `Fill` and undocked children share the rest). Columns
 * follow the inline direction, so `Left` is the inline start: a view mirrors correctly in `ar`/`he`.
 */
export declare function dockGrid(docks: readonly DockValue[]): DockGrid;
interface PanelProps extends ContainerBase {
    /** `Dock` (default) or `Absolute`. */
    layout?: 'Dock' | 'Absolute';
}
/** `<Panel>`: children docked as bands (`Dock`), or placed by `X`/`Y` in `Layout="Absolute"`. */
export declare const Panel: import("react").ForwardRefExoticComponent<PanelProps & import("react").RefAttributes<HTMLElement>>;
/**
 * `<UserControl>`: the root of a `.kbcontrol` — a dock container that fills the room its host gives it
 * (it shrinks with a capped host, so a `Dock="Fill"` child can scroll).
 */
export declare const UserControl: import("react").ForwardRefExoticComponent<PanelProps & import("react").RefAttributes<HTMLElement>>;
interface StackProps extends ContainerBase {
    direction?: string;
    gap?: number;
    crossAlign?: string;
    justify?: string;
    wrap?: boolean;
}
/** `<Stack>`: children along `Direction`, `Gap` px apart; a child with `Stack.Fill="true"` takes the rest. */
export declare const Stack: import("react").ForwardRefExoticComponent<StackProps & import("react").RefAttributes<HTMLElement>>;
interface ScrollAreaProps extends ContainerBase {
    /** `Corner`: radius of the scrolling viewport, px. */
    corner?: number;
    /** Web: `scrollbar-gutter`. */
    gutter?: 'Auto' | 'Stable' | 'StableBothEdges';
    /** Web: which axes scroll. */
    scrollBars?: 'Vertical' | 'Horizontal' | 'Both';
}
/** `<ScrollArea>`: its single child scrolls inside it (it shrinks with its container: `min-height: 0`). */
export declare const ScrollArea: import("react").ForwardRefExoticComponent<ScrollAreaProps & import("react").RefAttributes<HTMLElement>>;
export {};
