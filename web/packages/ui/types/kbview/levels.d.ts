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
/**
 * `HostStrings` — web only: the element's own strings (a close button's name, a default « Cancel », a table's
 * pager) come from the host's catalogue instead of the English defaults of `@ui`: the views runtime gives the
 * component the host's translator as its `t` (what a TSX screen does with `t={t}`). Spread into the elements
 * whose component takes a `t`.
 */
export declare const HOST_STRINGS: {
    readonly name: "HostStrings";
    readonly kind: "Bool";
    readonly default: "false";
    readonly category: "Behavior";
    readonly webOnly: true;
    readonly doc: "Web only: the control's own texts (a close button's name, a default Cancel) in the user's language, from the application's strings.";
    readonly docFr: "Web uniquement : les textes propres au contrôle (le nom d'un bouton Fermer, un Annuler par défaut) dans la langue de l'utilisateur, pris dans les textes de l'application.";
    readonly to: {
        readonly prop: "t";
        readonly convert: "host-t";
    };
};
/**
 * `FieldClass` — web only: Tailwind classes of the field itself (the `<input>` / `<textarea>`), where the `@ui`
 * component puts its `className` (`Class` styles the element's root, around the label and the help line). Tolerated
 * during the migration like `Class`.
 */
export declare const FIELD_CLASS: {
    readonly name: "FieldClass";
    readonly kind: "String";
    readonly default: "";
    readonly category: "Appearance";
    readonly webOnly: true;
    readonly doc: "Web only: style classes of the text box itself (Class styles the whole control, label included).";
    readonly docFr: "Web uniquement : classes de style de la zone de saisie elle-même (Class s'applique au contrôle entier, libellé compris).";
    readonly to: {
        readonly prop: "className";
    };
};
