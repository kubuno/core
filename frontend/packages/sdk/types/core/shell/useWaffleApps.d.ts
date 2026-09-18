import { type WaffleApp } from '../registry/WaffleAppRegistry';
/**
 * The full set of tiles the app launcher shows, shared by the desktop header
 * and the mobile FAB so neither can drift from the other.
 *
 * It is the active modules' apps (each tagged with its parent module so the
 * launcher can group sub-modules), plus — for anyone who may enter the
 * administration surface — a tile that opens the console. The admin tile is not
 * a module: it is grafted here, exactly as the console's own menu grafts the
 * marketplace link, and only when `isAdmin` grants it, so an ordinary user
 * never sees a door that would only refuse them.
 */
export declare function useWaffleApps(): WaffleApp[];
