/**
 * JSX text the way React sees it (Babel's / TypeScript's `cleanJSXElementLiteralChild`): lines are trimmed, lines
 * made only of whitespace are dropped, the remaining lines are joined with one space, and tabs become spaces.
 * A converted view must show the very same text, so the codemod applies the same rule before writing `Text`.
 */
export declare function cleanJsxText(raw: string): string;
/** Decodes the HTML entities JSX text and attribute strings may hold (`&nbsp;`, `&amp;`, `&#x2019;`…). */
export declare function decodeEntities(s: string): string;
/** An XML attribute value (double-quoted): `&`, `<`, `"` escaped, line breaks and tabs as character references. */
export declare function xmlAttr(s: string): string;
/**
 * Whether a literal can be written as an attribute value as it is: the `.kbview` grammar reads `{…}` as a markup
 * extension and has no escape, so such a literal goes through a getter instead.
 */
export declare function isSafeLiteral(s: string): boolean;
