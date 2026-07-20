import type { ReactNode } from 'react';
import type { ThemeDef } from '../store/themeStore';
/**
 * Renders its children inside a **Shadow DOM** so the theme preview is fully
 * isolated from the live (active) theme's global stylesheet.
 *
 * Why a shadow root rather than an <iframe>: it shares the page's realm, so
 * native scrolling works, and components that attach `document`/`window` drag
 * listeners (RangeSlider, ResizeHandle) keep working — an iframe would trap the
 * wheel and swallow those events. Style isolation still holds: the active theme's
 * `<link data-kbtheme>` is excluded, and outer rules cannot pierce the boundary.
 *
 * The shadow root is seeded with the app's base stylesheets (Tailwind utilities)
 * cloned from <head> — except the active theme. Tailwind v4 emits its design
 * tokens on `:root, :host`, so cloning makes `:host` (this shadow host) receive
 * them. The PREVIEWED theme is then applied to the host alone: its variables as
 * inline custom properties (overriding the `:host` defaults) plus its own
 * `global.css` injected inside the shadow root. Children mount through a nested
 * React root attached inside the shadow, so React events resolve correctly.
 */
export default function PreviewFrame({ theme, children }: {
    theme: ThemeDef;
    children: ReactNode;
}): import("react").JSX.Element;
