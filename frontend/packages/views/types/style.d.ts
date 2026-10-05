/**
 * Colours and interaction states of `.kbview` web elements (VIEWS-SPEC §4.1: theme tokens only).
 *
 * - `tokenColor` turns a colour value into CSS: a Kubuno theme token (`TextSecondary`, `Surface2`…, the
 *   desktop's `THEME_TOKENS` names) becomes the host's CSS variable, so it follows the light and dark themes
 *   and the module accent; a web colour name or a `#RRGGBB[AA]` literal passes through. Web extension: a
 *   token followed by `/NN` (`Primary/40`, `Border/50`) is that token at NN % opacity, the way the
 *   hand-written screens write `border-primary/40`.
 * - `ensureViewStyles` adds, once, the few rules inline styles cannot express: the hover / pressed
 *   backgrounds of any element (`HoverBackColor`, `PressedBackColor`) and the separator lines between a
 *   container's children (`DividerColor`).
 */
/**
 * A `.kbview` colour value → CSS. Theme tokens (`TextSecondary`) become their variable, `Token/NN` the token at
 * NN % opacity, `#RRGGBB` / `#RRGGBBAA` and web colour names pass through; anything else is returned as it is.
 */
export declare function tokenColor(value: string): string;
/** Shadows of `Elevation` (the Tailwind `shadow-sm` / `shadow-md` / `shadow-lg` steps of the host). */
export declare const ELEVATIONS: Readonly<Record<string, string>>;
/** Classes the runtime puts on an element's DOM root (styled by `VIEW_STYLES`). */
export declare const HOVER_CLASS = "kb-v-hover";
export declare const PRESSED_CLASS = "kb-v-pressed";
export declare const DIVIDE_CLASS = "kb-v-divide";
export declare const DIVIDE_X_CLASS = "kb-v-divide-x";
/** A container rendered as a native `<button>` (`AccessibleRole="PushButton"`). */
export declare const BUTTON_BOX_CLASS = "kb-v-btnbox";
/**
 * The view rules. Unlayered, so they win over the Tailwind utilities of a component (`hover:bg-…` of an
 * `@ui` Button), as the `.kbview` value written on the element must. The transition is Tailwind's
 * `transition-colors` (150 ms), the one the hand-written screens use.
 */
export declare const VIEW_STYLES: string;
/** Adds the view rules to the document once (no-op without a DOM). */
export declare function ensureViewStyles(): void;
