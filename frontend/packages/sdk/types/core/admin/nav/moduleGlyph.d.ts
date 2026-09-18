import type { ComponentType } from 'react';
import type { AdminModule } from '../adminModules';
/**
 * A module's face, from the one place the product already decides it.
 *
 * `WaffleAppRegistry` is populated at runtime by each module's own bundle, and
 * it is what the waffle menu, the shell sidebar and the app grid all read — so
 * taking anything else would give the console a second, quietly divergent
 * answer to "what does this application look like". It also carries brand logos
 * in colour, which an icon NAME cannot express.
 *
 * The registry only knows a module whose bundle has been LOADED, which a
 * disabled or unreachable module's never is — and those are exactly the rows an
 * operator needs to recognise. Hence the fallback on the icon name the core
 * stores at registration, which survives the module being down.
 *
 * Shared by the navigation tree and the application list on purpose: the same
 * module must not be drawn from two different sources in two places that sit
 * side by side on screen.
 */
export type ModuleGlyph = ComponentType<{
    size?: number;
    className?: string;
}>;
export declare function moduleGlyph(module: AdminModule): ModuleGlyph | null;
