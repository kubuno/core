/**
 * Colour resolution for the canvas-drawn controls (`Toggle`, `Radio`, `Checkbox`).
 *
 * A canvas context SILENTLY IGNORES an unparseable colour: `ctx.fillStyle = 'var(--x)'`
 * leaves the previous value in place, which on a fresh context is opaque black. The
 * control then renders as a black blob with no error anywhere — exactly what happened
 * when a caller passed `color="var(--color-primary)"`, perfectly valid for the CSS
 * implementation these replaced.
 *
 * So every colour that reaches a canvas goes through here: `var()` references are
 * resolved against the element (custom properties inherit, so a per-module accent
 * still applies), and anything the context cannot parse falls back instead of
 * silently blacking out.
 */
/**
 * Resolve a colour for canvas use.
 * @param el       element the custom properties are read from (they inherit)
 * @param value    author-supplied colour; may be `var(--x)`, `var(--x, fallback)`, or plain
 * @param fallback used when `value` is absent, empty, or unparseable
 */
export declare function resolveCssColor(el: Element, value: string | undefined | null, fallback: string): string;
