import type { ComponentType, ReactNode } from 'react';
/**
 * Extra sections contributed to the core share dialog.
 *
 * The dialog itself only knows what every shareable thing has in common: an
 * owner, people it is shared with, and a permission each. Anything specific —
 * a public link, an expiry date, a password, per-module options — is registered
 * here by the module that owns the resource. No cross-module import: the module
 * hands over a component, the core renders it under the common part.
 */
/** What a share dialog is opened on. */
export interface ShareTarget {
    /** Owning module, e.g. 'forms', 'office', 'drive'. */
    moduleId: string;
    /** Id of the resource being shared. */
    id: string;
    /** Optional sub-kind, so one module can offer different options per type
     *  (office: 'document' | 'spreadsheet' | 'presentation'…). */
    kind?: string;
}
export interface ShareSectionProps {
    target: ShareTarget;
}
export interface ShareSection {
    /** Stable id, also used as the React key. */
    id: string;
    /** Only shown for this module (and this kind, when given). */
    moduleId: string;
    kind?: string;
    /** Lower sorts first. */
    order?: number;
    /**
     * Where the section lands in the dialog:
     *  - 'general'  → under "Accès général" (default): link scope, roles…
     *  - 'notice'   → the highlighted note at the bottom of the main screen
     *  - 'settings' → the secondary screen behind the gear
     */
    slot?: 'general' | 'notice' | 'settings';
    /** Optional heading rendered above the section. */
    label?: ReactNode;
    Component: ComponentType<ShareSectionProps>;
}
export declare const ShareRegistry: {
    /** Register (or replace) a section. A module calls this in its `register()`. */
    add(section: ShareSection): void;
    remove(id: string): void;
    list(): ShareSection[];
    /** Sections that apply to a given target. */
    for(target: ShareTarget): ShareSection[];
    subscribe(fn: () => void): () => void;
};
/**
 * Kinds of recipient the share field can take, beyond what the core knows.
 *
 * The core only guarantees people and groups. A module that can resolve other
 * targets — calendar events, spaces, teams — declares its term here, and the
 * field's label grows accordingly. Declaring a kind is a promise that the
 * module's `searchRecipients` actually returns it.
 */
export interface ShareRecipientKind {
    id: string;
    moduleId: string;
    /** Plural, lower-case, as it reads in the label: "évènements d'agenda". */
    label: string;
    order?: number;
}
export declare const ShareRecipientKinds: {
    add(kind: ShareRecipientKind): void;
    remove(id: string): void;
    list(): ShareRecipientKind[];
    subscribe(fn: () => void): () => void;
};
