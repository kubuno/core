/**
 * Clipboard helpers for the table's context menu — pure functions, no React.
 *
 * Values are read from the RENDERED CELLS rather than from the row objects. A
 * column declares `cell` as a ReactNode (a badge, an icon plus a label, a
 * formatted date), so the object field is often not what is on screen — and it
 * is what is on screen that somebody right-clicking means to copy. Reading the
 * DOM also keeps the current sort and the current column order for free.
 *
 * Consequence worth knowing: copying a column copies the CURRENT PAGE, because
 * that is all the DOM holds. Rows on other pages were never rendered.
 *
 * Cells are found by `data-col`, never by index: the selection checkbox and the
 * row-actions cell would otherwise shift every offset by one.
 */
/** Text of one cell, whitespace-collapsed — `innerText` already skips hidden nodes. */
export declare function cellText(td: Element): string;
/** One row, tab-separated: pastes into a spreadsheet as separate columns. */
export declare function rowText(tr: Element): string;
/** Every rendered row for one column, one value per line. */
export declare function columnText(table: Element, colId: string): string;
/** Current text selection, if the user highlighted something before right-clicking. */
export declare function selectionText(): string;
/**
 * Write to the clipboard. `navigator.clipboard` is undefined outside a secure
 * context — the app served over plain http on a LAN address, for instance — so
 * the textarea + `execCommand` path is a real fallback here, not legacy noise.
 */
export declare function copyText(text: string): Promise<boolean>;
