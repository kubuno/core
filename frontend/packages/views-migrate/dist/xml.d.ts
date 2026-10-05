export interface Attr {
    name: string;
    /** The attribute value as written (a literal, `{Binding …}` or `{Res …}`). */
    value: string;
}
export interface XNode {
    el: string;
    attrs: Attr[];
    children: XNode[];
    /** A comment written above the element (a TODO of the migration). */
    comment?: string;
}
export declare function attr(node: XNode, name: string, value: string): void;
export declare function writeXml(root: XNode, header?: string): string;
