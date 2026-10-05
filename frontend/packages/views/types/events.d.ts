/**
 * Event args (VIEWS-SPEC §8, the same names on both targets) and the adapters that build them from a React
 * callback's or a DOM event's arguments (`args` of the registry's `event_map`).
 */
/** Base of every event args. `native` is the DOM / React event when there is one. */
export interface EventArgs {
    readonly native?: Event | {
        nativeEvent?: Event;
    };
    /** Raised by an element of a `Repeater`'s template: the item of its row. */
    readonly row?: unknown;
    /** …and that row's position in `ItemsSource`. */
    readonly rowIndex?: number;
}
export type MouseButton = 'Left' | 'Right' | 'Middle' | 'None';
export interface MouseEventArgs extends EventArgs {
    readonly button: MouseButton;
    readonly x: number;
    readonly y: number;
    readonly clicks: number;
    readonly ctrlKey: boolean;
    readonly shiftKey: boolean;
    readonly altKey: boolean;
}
export interface KeyEventArgs extends EventArgs {
    readonly key: string;
    readonly code: string;
    readonly ctrlKey: boolean;
    readonly shiftKey: boolean;
    readonly altKey: boolean;
    /** `true`: the event stops here (`stopPropagation`). */
    handled: boolean;
}
export interface KeyPressEventArgs extends KeyEventArgs {
    readonly keyChar: string;
}
export interface CancelEventArgs extends EventArgs {
    /** `true`: the default action / the change is refused (`preventDefault`). */
    cancel: boolean;
}
export interface DragEventArgs extends EventArgs {
    readonly dataTransfer: DataTransfer | null;
    readonly x: number;
    readonly y: number;
}
export interface ValueChangedEventArgs<T = unknown> extends EventArgs {
    readonly value: T;
}
export interface ItemEventArgs<T = unknown> extends EventArgs {
    readonly item: T;
    readonly index: number;
}
export interface ItemActivateEventArgs<T = unknown> extends EventArgs {
    readonly item: T;
    readonly index: number;
}
/** `PaintBox.OnPaint` (web): draw with `ctx`, in CSS pixels (the context is already scaled by `dpr`). */
export interface PaintEventArgs extends EventArgs {
    readonly ctx: CanvasRenderingContext2D;
    readonly width: number;
    readonly height: number;
    readonly dpr: number;
    /** The box's `PaintData`. */
    readonly data?: unknown;
}
/** An item of a `CheckedListBox` was checked or unchecked. `value` is `checked`. */
export interface ItemCheckEventArgs extends EventArgs {
    readonly index: number;
    readonly checked: boolean;
    readonly value: boolean;
}
interface DomLike {
    nativeEvent?: Event;
    button?: number;
    clientX?: number;
    clientY?: number;
    detail?: number;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    key?: string;
    code?: string;
    dataTransfer?: DataTransfer | null;
    target?: {
        value?: unknown;
        checked?: unknown;
    };
    stopPropagation?(): void;
    preventDefault?(): void;
}
/** What an adapter knows besides the callback's arguments. */
export interface ArgsContext {
    /** Item keys of the element's children → prop adapter (`key-to-index`). */
    keys?: readonly string[];
    /** The item key this event belongs to (`open-keys`, `item`). */
    itemKey?: string;
    item?: unknown;
    index?: number;
}
/** Builds `(e)` for a handler from the callback's arguments. Returns the args and the native event. */
export declare function makeArgs(adapter: string, raw: readonly unknown[], ctx?: ArgsContext): {
    e: EventArgs & Record<string, unknown>;
    native?: DomLike;
};
/** Applies `handled` / `cancel` written by the handler to the native event. */
export declare function applyArgs(e: Record<string, unknown>, native: DomLike | undefined): void;
export {};
