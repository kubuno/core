/**
 * Event args (VIEWS-SPEC §8, the same names on both targets) and the adapters that build them from a React
 * callback's or a DOM event's arguments (`args` of the registry's `event_map`).
 */

/** Base of every event args. `native` is the DOM / React event when there is one. */
export interface EventArgs {
  readonly native?: Event | { nativeEvent?: Event }
  /** Raised by an element of a `Repeater`'s template: the item of its row. */
  readonly row?: unknown
  /** …and that row's position in `ItemsSource`. */
  readonly rowIndex?: number
}

export type MouseButton = 'Left' | 'Right' | 'Middle' | 'None'

export interface MouseEventArgs extends EventArgs {
  readonly button: MouseButton
  readonly x: number
  readonly y: number
  readonly clicks: number
  readonly ctrlKey: boolean
  readonly shiftKey: boolean
  readonly altKey: boolean
}

export interface KeyEventArgs extends EventArgs {
  readonly key: string
  readonly code: string
  readonly ctrlKey: boolean
  readonly shiftKey: boolean
  readonly altKey: boolean
  /** `true`: the event stops here (`stopPropagation`). */
  handled: boolean
}

export interface KeyPressEventArgs extends KeyEventArgs {
  readonly keyChar: string
}

export interface CancelEventArgs extends EventArgs {
  /** `true`: the default action / the change is refused (`preventDefault`). */
  cancel: boolean
}

export interface DragEventArgs extends EventArgs {
  readonly dataTransfer: DataTransfer | null
  readonly x: number
  readonly y: number
}

export interface ValueChangedEventArgs<T = unknown> extends EventArgs {
  readonly value: T
}

export interface ItemEventArgs<T = unknown> extends EventArgs {
  readonly item: T
  readonly index: number
}

export interface ItemActivateEventArgs<T = unknown> extends EventArgs {
  readonly item: T
  readonly index: number
}

/** `PaintBox.OnPaint` (web): draw with `ctx`, in CSS pixels (the context is already scaled by `dpr`). */
export interface PaintEventArgs extends EventArgs {
  readonly ctx: CanvasRenderingContext2D
  readonly width: number
  readonly height: number
  readonly dpr: number
  /** The box's `PaintData`. */
  readonly data?: unknown
}

const BUTTONS: readonly MouseButton[] = ['Left', 'Middle', 'Right']

interface DomLike {
  nativeEvent?: Event
  button?: number
  clientX?: number
  clientY?: number
  detail?: number
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  key?: string
  code?: string
  dataTransfer?: DataTransfer | null
  target?: { value?: unknown; checked?: unknown }
  stopPropagation?(): void
  preventDefault?(): void
}

/** What an adapter knows besides the callback's arguments. */
export interface ArgsContext {
  /** Item keys of the element's children → prop adapter (`key-to-index`). */
  keys?: readonly string[]
  /** The item key this event belongs to (`open-keys`, `item`). */
  itemKey?: string
  item?: unknown
  index?: number
}

/** Builds `(e)` for a handler from the callback's arguments. Returns the args and the native event. */
export function makeArgs(adapter: string, raw: readonly unknown[], ctx: ArgsContext = {}): { e: EventArgs & Record<string, unknown>; native?: DomLike } {
  const a0 = raw[0] as DomLike | undefined
  const native = a0 && typeof a0 === 'object' && ('nativeEvent' in a0 || 'target' in a0 || a0 instanceof Event) ? a0 : undefined
  const base = { native: native as EventArgs['native'] }
  switch (adapter) {
    case 'mouse':
      return {
        native,
        e: { ...base, button: BUTTONS[a0?.button ?? 0] ?? 'None', x: a0?.clientX ?? 0, y: a0?.clientY ?? 0, clicks: a0?.detail ?? 1, ctrlKey: !!a0?.ctrlKey, shiftKey: !!a0?.shiftKey, altKey: !!a0?.altKey },
      }
    case 'dom':
      if (a0 && 'key' in a0) {
        return { native, e: { ...base, key: a0.key ?? '', code: a0.code ?? '', keyChar: a0.key ?? '', ctrlKey: !!a0.ctrlKey, shiftKey: !!a0.shiftKey, altKey: !!a0.altKey, handled: false, cancel: false } }
      }
      return { native, e: { ...base, dataTransfer: a0?.dataTransfer ?? null, x: a0?.clientX ?? 0, y: a0?.clientY ?? 0, handled: false, cancel: false } }
    case 'value':
      return { native, e: { ...base, value: raw[0] } }
    case 'target-value':
      return { native, e: { ...base, value: a0?.target?.value } }
    case 'target-checked':
      return { native, e: { ...base, value: a0?.target?.checked } }
    case 'key-to-index':
      return { native, e: { ...base, value: (ctx.keys ?? []).indexOf(String(raw[0])) } }
    case 'id-index':
      return { native, e: { ...base, value: raw[1] } }
    case 'open-keys': {
      const open = Array.isArray(raw[0]) ? (raw[0] as unknown[]).map(String).includes(ctx.itemKey ?? '') : !!raw[0]
      return { native, e: { ...base, value: open } }
    }
    case 'item':
      return { native, e: { ...base, item: ctx.item, index: ctx.index ?? -1 } }
    case 'row':
      return { native, e: { ...base, item: raw[0], index: typeof raw[1] === 'number' ? raw[1] : -1 } }
    case 'paint': {
      // The PaintBox hands its prepared painter arguments (`preparePaint`); not a DOM event.
      const p = (raw[0] ?? {}) as Record<string, unknown>
      return { native: undefined, e: { native: undefined, ctx: p.ctx, width: p.width, height: p.height, dpr: p.dpr, data: p.data } }
    }
    case 'sort':
      return { native, e: { ...base, value: (raw[0] as { columnId?: unknown } | undefined)?.columnId ?? raw[0] } }
    default:
      return { native, e: { ...base, cancel: false } }
  }
}

/** Applies `handled` / `cancel` written by the handler to the native event. */
export function applyArgs(e: Record<string, unknown>, native: DomLike | undefined): void {
  if (!native) return
  if (e.handled === true) native.stopPropagation?.()
  if (e.cancel === true) native.preventDefault?.()
}
