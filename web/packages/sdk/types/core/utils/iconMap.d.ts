import { type LucideIcon } from 'lucide-react';
export declare const ICON_MAP: Record<string, LucideIcon>;
export declare function getIcon(name: string): LucideIcon;
/**
 * Same lookup WITHOUT the fallback — for places where an unknown name must show
 * nothing rather than a stand-in.
 *
 * A sidebar entry has to be clickable, so `getIcon` owes it a glyph. A decorative
 * icon does not: a menu of five module pages where the two the core happens to
 * know show an icon and the three others show a cloud reads as three broken
 * rows. No icon at all is the honest rendering of "this name is not one we ship".
 */
export declare function findIcon(name: string | null | undefined): LucideIcon | null;
