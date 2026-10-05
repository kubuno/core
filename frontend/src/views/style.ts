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

/** Theme token → the host CSS variable that carries it (`theme.css` and the theme packages' `vars`). */
const TOKEN_VARS: Readonly<Record<string, string>> = {
  Primary: '--color-primary',
  PrimaryHover: '--color-primary-hover',
  PrimaryLight: '--color-primary-light',
  // Text on the accent: the themes repaint Tailwind's `white` (`--color-white`) to stay readable on it.
  OnPrimary: '--color-white',
  Background: '--body-bg',
  Surface: '--color-surface-0',
  Surface1: '--color-surface-1',
  Surface2: '--color-surface-2',
  Surface3: '--color-surface-3',
  TextPrimary: '--color-text-primary',
  TextSecondary: '--color-text-secondary',
  TextTertiary: '--color-text-tertiary',
  Border: '--color-border',
  BorderStrong: '--color-border-strong',
  Divider: '--color-border',
  Danger: '--color-danger',
  DangerLight: '--color-danger-light',
  Success: '--color-success',
  SuccessLight: '--color-success-light',
  Warning: '--color-warning',
  WarningLight: '--color-warning-light',
  Caution: '--color-warning',
  Selection: '--color-primary-light',
  ListSelected: '--color-primary-light',
  Hover: '--color-surface-1',
  ControlFillHover: '--color-surface-2',
  TitleBarBackground: '--color-primary',
  // The ground of the header's panels, the launcher and the account panel (SHELL-CONTROLS.md §8).
  PanelBackground: '--color-panel-bg',
}

/** Fallbacks of the tokens the host does not declare as variables. */
const TOKEN_LITERALS: Readonly<Record<string, string>> = {
  LinkVisited: '#681da8',
  TooltipBackground: '#3c4043',
  TooltipForeground: '#ffffff',
}

function tokenVar(token: string): string {
  const known = TOKEN_VARS[token]
  if (known) return `var(${known})`
  const literal = TOKEN_LITERALS[token]
  if (literal) return literal
  // An unknown name in PascalCase: the host's naming rule (`TextNav` → `--color-text-nav`).
  return `var(--color-${token.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([a-zA-Z])(\d)/g, '$1-$2').toLowerCase()})`
}

/** A web colour name (the desktop's `WEB_COLORS` are the CSS named colours, written in PascalCase). */
const IS_NAME = /^[A-Za-z]+$/

/**
 * A `.kbview` colour value → CSS. Theme tokens (`TextSecondary`) become their variable, `Token/NN` the token at
 * NN % opacity, `#RRGGBB` / `#RRGGBBAA` and web colour names pass through; anything else is returned as it is.
 */
export function tokenColor(value: string): string {
  const v = value.trim()
  if (!v) return v
  if (v.startsWith('#') || v.includes('(')) return v
  const alpha = /^([A-Za-z][A-Za-z0-9]*)\/(\d{1,3})$/.exec(v)
  if (alpha) return `color-mix(in oklab, ${tokenColor(alpha[1])} ${Math.min(100, Number(alpha[2]))}%, transparent)`
  if (TOKEN_VARS[v] || TOKEN_LITERALS[v]) return tokenVar(v)
  if (IS_NAME.test(v) && isCssColorName(v.toLowerCase())) return v.toLowerCase()
  return tokenVar(v)
}

function isCssColorName(name: string): boolean {
  const css = (globalThis as { CSS?: { supports?: (p: string, v: string) => boolean } }).CSS
  if (css?.supports) return css.supports('color', name)
  return ['transparent', 'white', 'black', 'red', 'green', 'blue', 'gray', 'grey'].includes(name)
}

/** Shadows of `Elevation` (the Tailwind `shadow-sm` / `shadow-md` / `shadow-lg` steps of the host). */
export const ELEVATIONS: Readonly<Record<string, string>> = {
  Sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  Md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  Lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
}

/** Classes the runtime puts on an element's DOM root (styled by `VIEW_STYLES`). */
export const HOVER_CLASS = 'kb-v-hover'
export const PRESSED_CLASS = 'kb-v-pressed'
export const DIVIDE_CLASS = 'kb-v-divide'
export const DIVIDE_X_CLASS = 'kb-v-divide-x'
/** A container rendered as a native `<button>` (`AccessibleRole="PushButton"`). */
export const BUTTON_BOX_CLASS = 'kb-v-btnbox'

/**
 * The view rules. Unlayered, so they win over the Tailwind utilities of a component (`hover:bg-…` of an
 * `@ui` Button), as the `.kbview` value written on the element must. The transition is Tailwind's
 * `transition-colors` (150 ms), the one the hand-written screens use.
 */
export const VIEW_STYLES = [
  `.${HOVER_CLASS},.${PRESSED_CLASS}{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}`,
  `.${HOVER_CLASS}:hover:not(:disabled):not([aria-disabled="true"]){background-color:var(--kb-v-hover-bg)!important}`,
  `.${PRESSED_CLASS}:active:not(:disabled):not([aria-disabled="true"]){background-color:var(--kb-v-pressed-bg)!important}`,
  // Tailwind's `divide-y`: a line under every child but the last.
  `:where(.${DIVIDE_CLASS}>:not(:last-child)){border-bottom:1px solid var(--kb-v-divide)}`,
  `:where(.${DIVIDE_X_CLASS}>:not(:last-child)){border-inline-end:1px solid var(--kb-v-divide)}`,
  // A <button> sizes to its content where a <div> fills the line: a button container fills it too, except
  // along a row or where its column places the children at their own width (CrossAlign other than Stretch).
  // An anchored child stretched between two edges of an absolute Panel fills the wrapper the Panel sizes.
  `[data-kb-anchor~=x]>*{width:100%!important}`,
  `[data-kb-anchor~=y]>*{height:100%!important}`,
  `:where(.${BUTTON_BOX_CLASS}){width:100%}`,
  `:where([data-kb-stack=row]>.${BUTTON_BOX_CLASS},[data-kb-cross]>.${BUTTON_BOX_CLASS}){width:auto}`,
].join('\n')

let injected = false

/** Adds the view rules to the document once (no-op without a DOM). */
export function ensureViewStyles(): void {
  if (injected || typeof document === 'undefined') return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-kb-views', '')
  el.textContent = VIEW_STYLES
  document.head.appendChild(el)
}
