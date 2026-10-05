/**
 * Code-behind of the user control `WaffleMenu` (`WaffleMenu.kbcontrol`; contract: vskubuno
 * `docs/SHELL-CONTROLS.md` §1). It knows no server and no router: its data come from its properties (or a
 * `LauncherService`), and every action is an event the host acts on (open the app and close its popover,
 * save the favourites).
 */
import { type ElementHandle, type IconButton, type Button, type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views';
import { ViewBase } from './WaffleMenu.kbcontrol';
import { type AppEventArgs, type ContentHeightEventArgs, type EditModeEventArgs, type FavoritesEventArgs, type LauncherApp, type LauncherService } from './model';
export interface WaffleMenuProps {
    /** `Apps`: the apps to show, in the server's order. */
    apps?: LauncherApp[];
    /** `Favorites`: the favourites exactly as the server holds them (unknown ids included). */
    favorites?: string[];
    /** `Editing`: controlled when given (the host then follows `onEditModeChanged`). */
    editing?: boolean;
    /** Web: shows « Plus de modules » (the account may manage the marketplace). */
    showMarketplace?: boolean;
    /** Web: the address of « Plus de modules ». */
    marketplaceHref?: string;
    /** Takes `Apps` / `Favorites` from the service, which then launches and saves. */
    service?: LauncherService;
    onAppLaunched?: (e: AppEventArgs) => void;
    onFavoritesEdited?: (e: FavoritesEventArgs) => void;
    onEditModeChanged?: (e: EditModeEventArgs) => void;
    onContentHeightChanged?: (e: ContentHeightEventArgs) => void;
    onCloseRequested?: () => void;
    /** Web: « Plus de modules » chosen. */
    onOpenMarketplace?: () => void;
}
export declare class WaffleMenu extends ViewBase {
    /** The edit mode when the host does not control it. */
    accessor ownEditing: boolean;
    /** The favourites being edited (shown ones, in order). */
    accessor draft: string[];
    private reportedHeight;
    private readonly appsOf;
    private readonly favoritesOf;
    private readonly knownOf;
    get apps(): LauncherApp[];
    /** The server's list, unknown ids included. */
    get favorites(): string[];
    get editing(): boolean;
    get viewing(): boolean;
    /** What the card shows: the saved favourites this launcher knows (the draft while editing). */
    get shown(): string[];
    get showMarketplace(): boolean;
    get marketplaceHref(): string;
    /** Abandons an edit first (Escape inside it); otherwise raises `CloseRequested`. */
    escape(): void;
    private setEditing;
    /** `ContentHeightChanged`: the host of a web popover sizes it with CSS and may ignore it. */
    private reportHeight;
    waffle_menu_load(_sender: ElementHandle): void;
    edit_button_click(_sender: IconButton, e: MouseEventArgs): void;
    cancel_button_click(_sender: Button): void;
    ok_button_click(_sender: Button): void;
    grid_favorites_edited(_sender: ElementHandle, e: ValueChangedEventArgs<string[]>): void;
    grid_tile_invoked(_sender: ElementHandle, e: ValueChangedEventArgs<string>): void;
    marketplace_click(_sender: ElementHandle): void;
}
declare const _default: import("react").FunctionComponent<Readonly<WaffleMenuProps>>;
export default _default;
