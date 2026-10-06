/**
 * `AppTileGrid` — the irreducible part of the `WaffleMenu` user control: the favourites card (with the
 * header the view gives it, `<AppTileGrid.Header>`) over every other app, three tiles to a row, and the
 * drag-and-drop edit of the favourites (reorder, add, remove). A designable custom control (WEB-VIEWS §10):
 * registered in the core's project registry (`kbview-controls.json`), placed and configured from the view.
 *
 * Same name and events as the desktop's `kubuno_header::AppTileGrid`: `TileInvoked` (a tile clicked outside
 * the edit mode) and `FavoritesEdited` (the list being edited changed: the list an « OK » would save).
 * Outside the edit mode the tiles are links, made items of the hosting menu by `MenuItemHostContext`.
 */
import { type ReactNode } from 'react';
import { type LauncherApp } from './model';
export interface AppTileGridProps {
    /** Every app of the launcher. */
    apps?: LauncherApp[];
    /** The favourites shown on the card, in order (the saved ones; the draft while editing). */
    favorites?: string[];
    editing?: boolean;
    /** The card's header band (`<AppTileGrid.Header>`). */
    header?: ReactNode;
    /** « Faites glisser vos applis ici » (an empty card while editing). */
    dropHereText?: string;
    /** « Toutes les apps sont dans vos favoris » (every app is a favourite while editing). */
    allFavoritesText?: string;
    /** `TileInvoked`: an app's tile was clicked outside the edit mode. */
    onTileInvoked?: (id: string) => void;
    /** `FavoritesEdited`: the favourites being edited changed (the new list). */
    onFavoritesEdited?: (favorites: string[]) => void;
}
export declare const AppTileGrid: import("@kubuno/views").DefinedControl<AppTileGridProps>;
