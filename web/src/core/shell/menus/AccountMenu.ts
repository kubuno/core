/**
 * Code-behind of the user control `AccountMenu` (`AccountMenu.kbcontrol`; contract: vskubuno
 * `docs/SHELL-CONTROLS.md` §2). It shows what its properties (or an `AccountService`) say and raises an
 * event for every click; switching, signing out, navigating and closing the popover are the host's.
 */
import i18n from 'i18next'
import { bind, type ElementHandle, type IconButton, type MouseEventArgs } from '@kubuno/views'

import { ViewBase } from './AccountMenu.kbcontrol'
import { initialsOf, memoize, type AccountEntry, type AccountEventArgs, type AccountService, type AccountUser } from './model'

export interface AccountMenuProps {
  /** `User`: the active account. */
  user?: AccountUser
  /** `Accounts`: the OTHER accounts (this browser's, then other instances'). */
  accounts?: AccountEntry[]
  /** `ShowAdmin`: lists « Administration ». */
  showAdmin?: boolean
  service?: AccountService
  /** Web: a switch is under way (the account rows are disabled). */
  busy?: boolean
  /** Web: the photo is being uploaded (the camera button is disabled). */
  avatarBusy?: boolean
  /** Web: the addresses of « Gérer votre compte », « Étiquettes », « Administration » (links). */
  manageHref?: string
  labelsHref?: string
  adminHref?: string
  onManageAccount?: () => void
  /** A row clicked: switch to it (a live session), reconnect it (« Connexion »), or open it (another instance). */
  onOpenAccount?: (e: AccountEventArgs) => void
  onRemoveAccount?: (e: AccountEventArgs) => void
  onAddAccount?: () => void
  onOpenLabels?: () => void
  onOpenAdmin?: () => void
  onSignOut?: () => void
  onChangeAvatar?: () => void
  onCloseRequested?: () => void
}

/** One row of the accounts card, with what the template binds. */
export interface AccountRow extends AccountEntry {
  key: string
  initials: string
  /** A live session of this instance: one click switches. */
  switchable: boolean
  /** A dead session of this instance: « Déconnecté » + Connexion / Supprimer. */
  disconnected: boolean
  hasUnread: boolean
  unreadText: string
}

/** A mini avatar of the folded accounts card (its single letter). */
export interface AccountPreview extends AccountEntry {
  letter: string
}

const NOBODY: AccountUser = { name: '', email: '', initials: '' }
const NONE: never[] = []

/** `t(key)` with the French fallback the panel always had for keys some languages lack. */
const tr = (key: string, defaultValue: string): string => i18n.t(key, { defaultValue })

export class AccountMenu extends ViewBase {
  /** The accounts card is unfolded (the panel opens with it unfolded). */
  @bind accessor expanded = true
  /** The hero has scrolled away: the header shows the mini avatar. */
  @bind accessor scrolled = false

  private readonly userOf = memoize((props: AccountMenuProps): AccountUser => props.service?.user() ?? props.user ?? NOBODY)
  private readonly accountsOf = memoize((props: AccountMenuProps): AccountEntry[] => props.service?.accounts() ?? props.accounts ?? NONE)
  private readonly rowsOf = memoize((accounts: AccountEntry[]): AccountRow[] =>
    // This browser's accounts first, then the other instances' (the panel's order).
    [...accounts.filter((a) => !a.remote), ...accounts.filter((a) => a.remote)].map((a) => ({
      ...a,
      key: `${a.remote ? 'r' : 'l'}:${a.id}`,
      initials: a.initials || initialsOf(a.name),
      switchable: !a.remote && a.connected,
      disconnected: !a.remote && !a.connected,
      remote: !!a.remote,
      hasUnread: (a.unread ?? 0) > 0,
      unreadText: (a.unread ?? 0) > 9 ? '9+' : String(a.unread ?? 0),
    })))
  private readonly previewsOf = memoize((accounts: AccountEntry[]): AccountPreview[] =>
    accounts.filter((a) => !a.remote).slice(0, 2).map((a) => ({ ...a, letter: a.name.slice(0, 1).toUpperCase() })))

  get user(): AccountUser {
    return this.userOf(this.props)
  }

  get accounts(): AccountEntry[] {
    return this.accountsOf(this.props)
  }

  get rows(): AccountRow[] {
    return this.rowsOf(this.accounts)
  }

  /** The two first accounts of this browser, as the folded card's mini avatars. */
  get previews(): AccountPreview[] {
    return this.previewsOf(this.accounts)
  }

  private get localOthers(): number {
    return this.accounts.filter((a) => !a.remote).length
  }

  get hasOthers(): boolean {
    return this.accounts.length > 0
  }

  get collapsed(): boolean {
    return !this.expanded
  }

  get hasMore(): boolean {
    return this.localOthers > 2
  }

  get moreText(): string {
    return `+${this.localOthers - 2}`
  }

  get toggleText(): string {
    return this.expanded ? i18n.t('shell.hide_more_accounts') : i18n.t('shell.show_more_accounts')
  }

  get greeting(): string {
    const u = this.user
    return i18n.t('shell.greeting', { name: u.name.split(' ')[0] || u.email })
  }

  get showAdmin(): boolean {
    return this.props.service?.canAdminister() ?? !!this.props.showAdmin
  }

  get canSwitch(): boolean {
    return !this.props.busy
  }

  get canChangeAvatar(): boolean {
    return !this.props.avatarBusy
  }

  get manageHref(): string { return this.props.manageHref ?? '#' }
  get labelsHref(): string { return this.props.labelsHref ?? '#' }
  get adminHref(): string { return this.props.adminHref ?? '#' }

  get labelsText(): string { return tr('user.labels', 'Étiquettes') }
  get disconnectedText(): string { return tr('account.disconnected', 'Déconnecté') }
  get reconnectText(): string { return tr('account.reconnect', 'Connexion') }
  get removeText(): string { return tr('common.delete', 'Supprimer') }
  get openText(): string { return tr('account.open', 'Ouvrir') }

  /** Signing out of every account of this browser when there are several (« Se déconnecter de tous les comptes »). */
  get signOutText(): string {
    return this.localOthers > 0
      ? tr('shell.logout_all', 'Se déconnecter de tous les comptes')
      : i18n.t('user.logout')
  }

  /** Escape: raises `CloseRequested` (the host closes and gives the focus back to its button). */
  escape(): void {
    this.props.onCloseRequested?.()
  }

  account_menu_load(_sender: ElementHandle): void {
    // The compact header once the hero has scrolled away (48px), as the panel always did.
    const body = this.body.element
    if (!body) return
    const onScroll = () => { this.scrolled = body.scrollTop > 48 }
    body.addEventListener('scroll', onScroll, { passive: true })
  }

  close_button_click(_sender: IconButton): void {
    this.props.onCloseRequested?.()
  }

  camera_button_click(_sender: IconButton): void {
    this.props.onChangeAvatar?.()
  }

  manage_click(_sender: ElementHandle): void {
    this.props.onManageAccount?.()
  }

  toggle_click(_sender: ElementHandle): void {
    this.expanded = !this.expanded
  }

  private rowId(e: MouseEventArgs): string | null {
    const row = e.row as AccountRow | undefined
    return row ? row.id : null
  }

  account_click(_sender: ElementHandle, e: MouseEventArgs): void {
    const id = this.rowId(e)
    if (id !== null && this.canSwitch) this.props.onOpenAccount?.({ id })
  }

  reconnect_click(_sender: ElementHandle, e: MouseEventArgs): void {
    const id = this.rowId(e)
    if (id !== null) this.props.onOpenAccount?.({ id })
  }

  open_remote_click(_sender: ElementHandle, e: MouseEventArgs): void {
    const id = this.rowId(e)
    if (id !== null) this.props.onOpenAccount?.({ id })
  }

  remove_click(_sender: ElementHandle, e: MouseEventArgs): void {
    const id = this.rowId(e)
    if (id !== null) this.props.onRemoveAccount?.({ id })
  }

  add_account_click(_sender: ElementHandle): void {
    this.props.onAddAccount?.()
  }

  labels_click(_sender: ElementHandle): void {
    this.props.onOpenLabels?.()
  }

  admin_click(_sender: ElementHandle): void {
    this.props.onOpenAdmin?.()
  }

  sign_out_click(_sender: ElementHandle): void {
    this.props.onSignOut?.()
  }
}

export default AccountMenu.component()
