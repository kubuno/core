/**
 * What the runtime resolves at run time rather than through imports: components of interpreted plans (the
 * designer's — compiled plans import theirs), Lucide icons by name, `{Res}` strings, and the elements
 * modules register at load time (`registerElements`, the module isolation rule 2: a module's own controls
 * are registered dynamically, never statically linked from another module).
 */
import type { ComponentType } from 'react';
type AnyComponent = ComponentType<Record<string, unknown>>;
type IconComponent = ComponentType<{
    size?: number;
    color?: string;
    className?: string;
}>;
/**
 * Registers the exports of a module under its specifier (`'@ui'`, `'@kubuno/sdk'`, a module's own
 * `'controls'`…), for plans that name components by module/export (interpreted plans, the designer).
 */
export declare function registerElements(specifier: string, exports: Readonly<Record<string, unknown>>): void;
/** The component exported as `name` by `specifier` (registered with `registerElements`). */
export declare function resolveComponent(specifier: string | undefined, name: string | undefined): AnyComponent | undefined;
/** Sets how an icon name (`Save`, `trash`) becomes a component (the host passes its `ICON_MAP` lookup). */
export declare function setIconResolver(resolve: (name: string) => IconComponent | undefined): void;
export declare function resolveIcon(name: string): IconComponent | undefined;
/**
 * Sets how `{Res key[, Source=set]}` resolves (the host passes i18next's `t`). Call
 * `invalidateResources()` when the language changes: every live view re-reads its strings.
 */
export declare function setResourceResolver(resolve: (key: string, set?: string) => string): void;
export declare function resolveResource(key: string, set?: string): string;
export declare function invalidateResources(): void;
/** @internal */
export declare function onResourcesChanged(listener: () => void): () => void;
/** @internal */
export declare function resourcesVersion(): number;
export {};
