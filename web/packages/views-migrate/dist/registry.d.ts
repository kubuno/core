/** One `prop_map` entry. */
export interface PropTarget {
    prop?: string;
    runtime?: string;
    field?: string;
    convert?: string;
    values?: Record<string, unknown>;
    change?: string;
}
/** One `event_map` entry. */
export interface EventSource {
    prop?: string;
    dom?: string;
    runtime?: string;
    field?: string;
    args?: string;
}
/** A `.kbview` element as seen from the React component it renders. */
export interface ElementInfo {
    name: string;
    module: string;
    export: string;
    /** `children` model of the element (`None`, `SingleWidget`, `List`). */
    children: string;
    /** The React prop receiving the element's children (content), if any. */
    content?: string;
    /** React prop → `.kbview` property (direct `prop` targets only), with the reverse value map of enums. */
    props: Map<string, {
        name: string;
        values?: Map<string, string>;
        convert?: string;
        change?: string;
    }>;
    /** React prop → `.kbview` event (`prop` sources). */
    events: Map<string, {
        name: string;
        args?: string;
    }>;
    /** `.kbview` property names (any target), for properties the codemod writes itself (`Class`, `Visible`…). */
    propertyNames: Set<string>;
    /** `.kbview` event names. */
    eventNames: Set<string>;
    /** Default values of the properties (to leave out what equals the default). */
    defaults: Map<string, string>;
    /** Properties taking an object or a list (registry editor `object` / `list`), not a text. */
    objectProps: Set<string>;
    /**
     * React props fed field by field (`action={{ label, onClick }}` → `ActionLabel` + `OnAction`): React prop → field →
     * the property or event it is.
     */
    fields: Map<string, Map<string, FieldTarget>>;
    /** React props holding elements written as property elements (`actions` → `<Card.Actions>`): React prop → property. */
    slots: Map<string, string>;
}
/** One field of a React object prop: a `.kbview` property or event. */
export type FieldTarget = {
    kind: 'prop';
    name: string;
    values?: Map<string, string>;
    convert?: string;
} | {
    kind: 'event';
    name: string;
    args?: string;
};
export declare class Registry {
    private readonly byExport;
    private readonly byName;
    /** Loads registries (host first, then project registries, whose `./x` modules are relative to `base`). */
    static load(files: ReadonlyArray<{
        file: string;
        rewriteModule?: (m: string) => string;
    }>): Registry;
    private add;
    /** The element rendering export `name` of `module` (`@ui#Button` → `Button`). */
    element(module: string, name: string): ElementInfo | undefined;
    byElementName(name: string): ElementInfo | undefined;
}
