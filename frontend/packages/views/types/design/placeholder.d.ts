/**
 * The stand-in of a project control the surface cannot load (bundled mode, or its module failed to import): a
 * dashed box with the element's name, so the view still renders and the element stays selectable. Its children
 * and slot contents (a property element such as `<AppTileGrid.Header>`) are rendered inside it.
 */
import { type ComponentType } from 'react';
/** A placeholder component labelled `name` (`reason` in its tooltip). */
export declare function makePlaceholder(name: string, reason: string): ComponentType<Record<string, unknown>>;
