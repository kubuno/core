/**
 * The inherited levels of the web element registry: the members every control gets from
 * `Control` (and the view's root from `View`), named and typed exactly like the desktop's
 * (`kubuno-views` `registry::common`, `VIEW_PROPERTIES`, `COMMON_EVENTS`, `VIEW_EVENTS`).
 *
 * Only the members the web runtime implements are listed; the desktop members the web does
 * not have (window chrome, GDI fonts, background images…) are named, with a reason, in
 * `conformance.allowlist.ts`. Every member here is applied by the views runtime around the
 * component (`runtime` targets), not by the component itself; an element remaps one onto a
 * real prop with `inheritedMap` (e.g. `Enabled` → `disabled`).
 */
import type { EventMeta, PropertyMeta } from './types.ts';
/** `Control`'s properties on the web (desktop names, kinds, defaults and documentation). */
export declare const CONTROL_PROPERTIES: readonly PropertyMeta<never>[];
/** `Control`'s common events on the web, raised by the runtime from DOM listeners on the root. */
export declare const CONTROL_EVENTS: readonly EventMeta<never>[];
/** `View`'s properties — accepted on the view's root element only. */
export declare const VIEW_PROPERTIES: readonly PropertyMeta<never>[];
/** `View`'s events — accepted on the view's root element only. */
export declare const VIEW_EVENTS: readonly EventMeta<never>[];
/**
 * `IconSize`, `IconScaling`, `IconColor` — the own properties every element with an icon has on
 * the desktop. On the web the `icon-node` converter of the element's `Icon` applies them.
 */
export declare const ICON_PROPERTIES: readonly PropertyMeta<never>[];
/** `TextBoxBase`'s properties the web supports (each text element maps them in `inheritedMap`). */
export declare const TEXT_BOX_BASE_PROPERTIES: readonly PropertyMeta<never>[];
/** One inherited level: the members a base class gives every element whose chain names it. */
export interface InheritedLevel {
    readonly properties: readonly PropertyMeta<never>[];
    readonly events: readonly EventMeta<never>[];
}
/**
 * The levels of the control hierarchy the web implements, by class name (the desktop's
 * `base_chain` names). A level absent here contributes nothing on the web; the conformance
 * allowlist says which desktop levels are not implemented yet and why.
 */
export declare const INHERITED_LEVELS: Readonly<Record<string, InheritedLevel>>;
/** The web-only members of the inherited levels (listed in the export, allowlisted in conformance). */
export declare const WEB_ONLY_INHERITED: Set<string>;
