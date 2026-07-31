/**
 * Marks a floating menu panel. Used to tell "inside the menu" from "outside" even across
 * portals: cascading submenus are rendered into `document.body`, so a DOM `contains()`
 * check on the parent panel would wrongly report them as outside.
 */
export declare const MENU_ATTR = "data-kb-menu";
/**
 * Dismisses a floating menu on any interaction that is not aimed at it: a keystroke
 * somewhere else, or the window losing focus (alt-tab, devtools, another app).
 * Escape always closes, even from inside.
 *
 * Outside *clicks* are deliberately NOT handled here: each menu already closes on them,
 * and a generic handler would fight the trigger buttons — the pointerdown would close the
 * menu, then the trigger's click would reopen it, so toggling would look broken.
 */
export declare function useMenuDismiss(active: boolean, onClose: () => void): void;
