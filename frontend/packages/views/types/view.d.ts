/**
 * The code-behind model (VIEWS-SPEC §9.1): `View` (base of every generated `ViewBase`), the `@bind`
 * accessor decorator, the generated base factory `createViewBase`, element handles, and the live-view
 * registry behind HMR (plan swap for a `.kbview` edit, prototype swap for a code-behind edit).
 */
import type { ComponentType } from 'react';
import { type ViewPlan } from './plan';
import type { Scope } from './binding';
/** The runtime state of one mounted view instance. */
export interface Internals {
    readonly vm: View<object>;
    readonly cell: Cell;
    readonly scope: Scope;
    version: number;
    readonly listeners: Set<() => void>;
    readonly subscribe: (listener: () => void) => () => void;
    /** `@bind` storage (kept on the instance, not in the class's private slots, so a prototype swap keeps it). */
    readonly values: Map<string, unknown>;
    /** Values set through element handles: element id → property → value. */
    readonly overrides: Map<string, Map<string, unknown>>;
    /** Root DOM node of each rendered element, by element id. */
    readonly dom: Map<string, HTMLElement>;
    readonly handles: Map<string, ElementHandle>;
    state: 'new' | 'mounted' | 'unmounted';
    /** Inside `use()`: notifications are deferred to the commit. */
    deferred: boolean;
    pending: boolean;
    /** Design mode (the designer): no handler ever runs. */
    design: boolean;
    /** Current size class (`Compact`, `Medium`, `Expanded`). */
    sizeClass: string;
    /** Reads an element's current property value (set by the renderer). */
    read?: (id: string, property: string) => unknown;
}
/** One view file's live state: its current plan, its mounted instances, its latest code-behind class. */
export interface Cell {
    plan: ViewPlan;
    readonly instances: Set<Internals>;
    base?: ViewClass;
    latest?: ViewClass;
}
/** The handle of an element named by `x:Name` (VIEWS-SPEC §9.1): camelCase properties, read/write. */
export interface ElementHandle {
    /** The element id (`0.1.2`). */
    readonly id: string;
    /** The element's root DOM node, once rendered. */
    readonly element: HTMLElement | null;
    focus(): void;
    click(): void;
}
export type ViewClass = (abstract new () => View<any>) & {
    [CELL]?: Cell;
};
export declare const KB: unique symbol;
export declare const CELL: unique symbol;
/** Notifies the elements of a view that its state changed. */
export declare function notify(i: Internals): void;
/** Re-renders every live view (language change, theme change). */
export declare function invalidateViews(): void;
/** @internal */
export declare function setLive(i: Internals, on: boolean): void;
/** The handle of element `id` of a view. */
export declare function handleFor(i: Internals, id: string): ElementHandle;
/**
 * Base of every view's code-behind (through its generated `ViewBase`). `P` is the root's `x:Props`.
 */
export declare abstract class View<P extends object = object> {
    /** @internal */
    readonly [KB]: Internals;
    /** The props the view was rendered with. */
    props: Readonly<P>;
    /** Paths not found on the instance resolve here (VIEWS-SPEC §6.1). */
    dataContext: unknown;
    constructor();
    /** Runs on every render of the view; the only place React hooks are allowed. */
    use(): void;
    /** A string of the view's resources (`{Res}`) in the current language. */
    t(key: string, set?: string): string;
    /** Marks the view as changed (after mutating a `@bind` object in place). */
    invalidate(): void;
    /** The view as a React component (`export default MyView.component()`). */
    static component<T extends View<any>>(this: abstract new () => T): ComponentType<T['props']>;
}
/** @internal — set by the renderer (keeps this module free of React rendering code). */
export declare function setComponentFactory(f: (cell: Cell, cls: ViewClass) => ComponentType<object>): void;
type Accessor<This, V> = {
    get(this: This): V;
    set(this: This, value: V): void;
};
/**
 * `@bind accessor name = value` — a bindable field: assigning it re-renders the elements bound to it
 * (VIEWS-SPEC §9.1). Mutating an object in place is not seen: assign a new object, or call `invalidate()`.
 */
export declare function bind<This extends View<object>, V>(target: Accessor<This, V>, context: ClassAccessorDecoratorContext<This, V>): ClassAccessorDecoratorResult<This, V>;
/**
 * The generated base of a view's code-behind (`export const ViewBase = createViewBase(plan, key)`). With a
 * `hotKey` (dev server: the module URL), a re-evaluated view module swaps its new plan into the live views
 * and returns the same class.
 */
export declare function createViewBase(plan: ViewPlan, hotKey?: string | false): ViewClass;
export {};
