/**
 * The asterisk that says "this one is not optional".
 *
 * Project rule: a required field carries a mark on its label. One component so
 * the mark is the same glyph, the same colour and the same spacing on every
 * field — a rule written once is a rule that survives; a rule recopied into
 * forty forms drifts by the tenth.
 *
 * `aria-hidden`: the asterisk is decoration for the eye. Assistive technology is
 * told through `aria-required` on the field itself, which is what it actually
 * announces — a screen reader spelling out "star" helps nobody.
 */
export declare function RequiredMark(): import("react").JSX.Element;
/** A label with its mark, for the primitives that render one. */
export declare function labelWithMark(label: React.ReactNode, required?: boolean): string | number | bigint | boolean | Iterable<import("react").ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
