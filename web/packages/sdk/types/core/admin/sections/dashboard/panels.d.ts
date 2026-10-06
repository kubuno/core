import type { PanelDef } from '../../panels/types';
/**
 * What each panel of the general dashboard IS — the half the server does not
 * send.
 *
 * Same contract as the security overview's own table: a panel the server returns
 * that is NOT here is dropped rather than rendered with its raw id, and a panel
 * here that the server does not return is simply absent (which is what a
 * withheld privilege looks like).
 *
 * ## Polarity
 *
 * Everything on this page is `neutral`. Unlike the security overview, none of
 * these movements is bad in itself: more accounts, more sessions, more storage
 * used are facts an operator interprets, not incidents. Painting a rise in
 * consumption red would be the console having an opinion about a disk.
 */
export declare const PANELS: PanelDef[];
/** The default order — the order they are declared in. */
export declare const DEFAULT_ORDER: string[];
export declare function panelDef(id: string): PanelDef | undefined;
