import type { PanelDef } from '../panels/types';
/**
 * What each security panel IS — the half of a panel the server does not send.
 *
 * The server sends counts; this table says what those counts are called, which
 * report answers them in full, how they should be read, and which privilege
 * governs them. Keeping it here rather than in the payload is deliberate: the
 * wording is translated, the report link is an address this build knows how to
 * spell, and neither belongs in an API another client may consume.
 *
 * A panel the server returns that is NOT in this table is dropped rather than
 * rendered with its raw id — an older console must not invent a title for a
 * newer server's panel. A panel in this table the server does not return is
 * simply absent, which is what happens for a withheld privilege.
 *
 * The SHAPE of an entry is shared with every other panelled page
 * (`../panels/types`), so a field added for one dashboard is available to all of
 * them instead of being invented twice.
 */
export type { PanelDef, PanelPolarity, PanelShape } from '../panels/types';
export declare const PANELS: PanelDef[];
/** The default order — the order they are declared in. */
export declare const DEFAULT_ORDER: string[];
export declare function panelDef(id: string): PanelDef | undefined;
