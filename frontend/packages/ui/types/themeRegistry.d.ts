import type { ComponentType } from 'react';
/**
 * ComponentRegistry — the indirection that lets a theme replace the *markup and
 * behaviour* (not just the colours) of a UI "object", from primitives to complex
 * components, either globally or for a specific module.
 *
 * A themeable component is declared with `themed('<key>', Base)`. At render time
 * it resolves its implementation through this registry: a per-module override
 * wins over a global override, which wins over the built-in `Base`. A theme's
 * script registers overrides here (via the theme API handed to it at load time);
 * switching theme calls `clearAll()` to drop the previous theme's overrides.
 *
 * Lives in `@ui` so primitives can consult it without importing from `core`; it
 * is also re-exported from `@kubuno/sdk` for module authors.
 */
type AnyComp = ComponentType<any>;
export declare const ComponentRegistry: {
    /** Register an override for `key`. With `moduleId`, scopes it to that module. */
    register(key: string, Component: AnyComp, opts?: {
        moduleId?: string;
    }): void;
    unregister(key: string, opts?: {
        moduleId?: string;
    }): void;
    /** Resolve the active implementation: module-scoped → global → undefined. */
    resolve(key: string, moduleId?: string): AnyComp | undefined;
    /** Drop every override registered for a single module (e.g. on module unload). */
    clearModule(moduleId: string): void;
    /** Drop ALL overrides — called when switching theme. */
    clearAll(): void;
    /** Register an override for the isolated preview scope (flat, ignores moduleId). */
    registerPreview(key: string, Component: AnyComp): void;
    /** Resolve an override within the preview scope only. */
    resolvePreview(key: string): AnyComp | undefined;
    /** Drop every preview override — called when the previewed theme changes. */
    clearPreview(): void;
    subscribe(cb: () => void): () => void;
    getVersion(): number;
};
/**
 * Context carrying the id of the module currently being rendered. The host's
 * `ModuleArea` provides it, so a `themed()` primitive rendered inside a module
 * automatically prefers that module's overrides.
 */
export declare const ThemeScopeContext: import("react").Context<string | undefined>;
/**
 * When true, `themed()` components resolve from the isolated preview scope only
 * (theme being previewed in the admin pane), never from the live global/module
 * overrides. Wrap a preview gallery in `<ThemePreviewContext.Provider value>`.
 */
export declare const ThemePreviewContext: import("react").Context<boolean>;
/** Subscribe a component to registry changes so it re-renders on theme swap. */
export declare function useThemeVersion(): number;
/**
 * Wrap a base component so a theme can override it. The returned component is a
 * drop-in replacement for `Base`: same props, same type (including generics and
 * `forwardRef` refs), and it renders `Base` unchanged until a theme registers an
 * override. Refs are forwarded only to targets that accept them, so wrapping a
 * plain function component never triggers React's "cannot be given refs" warning.
 */
export declare function themed<C extends ComponentType<any>>(key: string, Base: C): C;
export {};
