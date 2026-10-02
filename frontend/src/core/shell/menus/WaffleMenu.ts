/**
 * Code-behind of the user control `WaffleMenu` (`WaffleMenu.kbcontrol`; contract: vskubuno
 * `docs/SHELL-CONTROLS.md` §1). It knows no server and no router: its data come from its properties (or a
 * `LauncherService`), and every action is an event the host acts on (open the app and close its popover,
 * save the favourites).
 */
import { bind, type ElementHandle, type IconButton, type Button, type MouseEventArgs, type ValueChangedEventArgs } from '@kubuno/views'

import { ViewBase } from './WaffleMenu.kbcontrol'
import {
  memoize,
  savedFavorites,
  type AppEventArgs,
  type ContentHeightEventArgs,
  type EditModeEventArgs,
  type FavoritesEventArgs,
  type LauncherApp,
  type LauncherService,
} from './model'

export interface WaffleMenuProps {
  /** `Apps`: the apps to show, in the server's order. */
  apps?: LauncherApp[]
  /** `Favorites`: the favourites exactly as the server holds them (unknown ids included). */
  favorites?: string[]
  /** `Editing`: controlled when given (the host then follows `onEditModeChanged`). */
  editing?: boolean
  /** Web: shows « Plus de modules » (the account may manage the marketplace). */
  showMarketplace?: boolean
  /** Web: the address of « Plus de modules ». */
  marketplaceHref?: string
  /** Takes `Apps` / `Favorites` from the service, which then launches and saves. */
  service?: LauncherService
  onAppLaunched?: (e: AppEventArgs) => void
  onFavoritesEdited?: (e: FavoritesEventArgs) => void
  onEditModeChanged?: (e: EditModeEventArgs) => void
  onContentHeightChanged?: (e: ContentHeightEventArgs) => void
  onCloseRequested?: () => void
  /** Web: « Plus de modules » chosen. */
  onOpenMarketplace?: () => void
}

const NONE: never[] = []

export class WaffleMenu extends ViewBase {
  /** The edit mode when the host does not control it. */
  @bind accessor ownEditing = false
  /** The favourites being edited (shown ones, in order). */
  @bind accessor draft: string[] = []
  private reportedHeight = -1

  // Bound getters return the same arrays while their inputs are the same (see `memoize`).
  private readonly appsOf = memoize((props: WaffleMenuProps): LauncherApp[] => props.service?.apps() ?? props.apps ?? NONE)
  private readonly favoritesOf = memoize((props: WaffleMenuProps): string[] => props.service?.favorites() ?? props.favorites ?? NONE)
  private readonly knownOf = memoize((favorites: string[], apps: LauncherApp[]): string[] => {
    const known = new Set(apps.map((a) => a.id))
    return favorites.filter((id) => known.has(id))
  })

  get apps(): LauncherApp[] {
    return this.appsOf(this.props)
  }

  /** The server's list, unknown ids included. */
  get favorites(): string[] {
    return this.favoritesOf(this.props)
  }

  get editing(): boolean {
    return this.props.editing ?? this.ownEditing
  }

  get viewing(): boolean {
    return !this.editing
  }

  /** What the card shows: the saved favourites this launcher knows (the draft while editing). */
  get shown(): string[] {
    return this.editing ? this.draft : this.knownOf(this.favorites, this.apps)
  }

  get showMarketplace(): boolean {
    return !!this.props.showMarketplace && this.viewing
  }

  get marketplaceHref(): string {
    return this.props.marketplaceHref ?? '#'
  }

  /** Abandons an edit first (Escape inside it); otherwise raises `CloseRequested`. */
  escape(): void {
    if (this.editing) this.setEditing(false)
    else this.props.onCloseRequested?.()
  }

  private setEditing(editing: boolean): void {
    if (editing === this.editing) return
    if (editing) this.draft = [...this.shown]
    if (this.props.editing === undefined) this.ownEditing = editing
    this.props.onEditModeChanged?.({ editing })
    this.reportHeight()
  }

  /** `ContentHeightChanged`: the host of a web popover sizes it with CSS and may ignore it. */
  private reportHeight(): void {
    queueMicrotask(() => {
      const el = this.body.element
      const h = el ? el.scrollHeight : 0
      if (h !== this.reportedHeight) {
        this.reportedHeight = h
        this.props.onContentHeightChanged?.({ height: h })
      }
    })
  }

  waffle_menu_load(_sender: ElementHandle): void {
    this.reportHeight()
  }

  edit_button_click(_sender: IconButton, e: MouseEventArgs): void {
    // The click must not reach the hosting menu (it would take it as a choice and close).
    const native = e.native as Event | undefined
    native?.stopPropagation()
    this.setEditing(true)
  }

  cancel_button_click(_sender: Button): void {
    this.setEditing(false)
  }

  ok_button_click(_sender: Button): void {
    const favorites = savedFavorites(this.draft, this.favorites, this.apps)
    this.setEditing(false)
    this.props.service?.saveFavorites(favorites)
    this.props.onFavoritesEdited?.({ favorites })
  }

  grid_favorites_edited(_sender: ElementHandle, e: ValueChangedEventArgs<string[]>): void {
    this.draft = e.value
    this.reportHeight()
  }

  grid_tile_invoked(_sender: ElementHandle, e: ValueChangedEventArgs<string>): void {
    this.props.service?.launch(e.value)
    this.props.onAppLaunched?.({ id: e.value })
  }

  marketplace_click(_sender: ElementHandle): void {
    this.props.onOpenMarketplace?.()
  }
}

export default WaffleMenu.component()
