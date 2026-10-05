import { type ElementHandle, type IconButton, type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './AccountMenu.kbcontrol';
import { type AccountEntry, type AccountEventArgs, type AccountService, type AccountUser } from './model';
export interface AccountMenuProps {
    /** `User`: the active account. */
    user?: AccountUser;
    /** `Accounts`: the OTHER accounts (this browser's, then other instances'). */
    accounts?: AccountEntry[];
    /** `ShowAdmin`: lists « Administration ». */
    showAdmin?: boolean;
    service?: AccountService;
    /** Web: a switch is under way (the account rows are disabled). */
    busy?: boolean;
    /** Web: the photo is being uploaded (the camera button is disabled). */
    avatarBusy?: boolean;
    /** Web: the addresses of « Gérer votre compte », « Étiquettes », « Administration » (links). */
    manageHref?: string;
    labelsHref?: string;
    adminHref?: string;
    onManageAccount?: () => void;
    /** A row clicked: switch to it (a live session), reconnect it (« Connexion »), or open it (another instance). */
    onOpenAccount?: (e: AccountEventArgs) => void;
    onRemoveAccount?: (e: AccountEventArgs) => void;
    onAddAccount?: () => void;
    onOpenLabels?: () => void;
    onOpenAdmin?: () => void;
    onSignOut?: () => void;
    onChangeAvatar?: () => void;
    onCloseRequested?: () => void;
}
/** One row of the accounts card, with what the template binds. */
export interface AccountRow extends AccountEntry {
    key: string;
    initials: string;
    /** A live session of this instance: one click switches. */
    switchable: boolean;
    /** A dead session of this instance: « Déconnecté » + Connexion / Supprimer. */
    disconnected: boolean;
    hasUnread: boolean;
    unreadText: string;
}
/** A mini avatar of the folded accounts card (its single letter). */
export interface AccountPreview extends AccountEntry {
    letter: string;
}
export declare class AccountMenu extends ViewBase {
    /** The accounts card is unfolded (the panel opens with it unfolded). */
    accessor expanded: boolean;
    /** The hero has scrolled away: the header shows the mini avatar. */
    accessor scrolled: boolean;
    private readonly userOf;
    private readonly accountsOf;
    private readonly rowsOf;
    private readonly previewsOf;
    get user(): AccountUser;
    get accounts(): AccountEntry[];
    get rows(): AccountRow[];
    /** The two first accounts of this browser, as the folded card's mini avatars. */
    get previews(): AccountPreview[];
    private get localOthers();
    get hasOthers(): boolean;
    get collapsed(): boolean;
    get hasMore(): boolean;
    get moreText(): string;
    get toggleText(): string;
    get greeting(): string;
    get showAdmin(): boolean;
    get canSwitch(): boolean;
    get canChangeAvatar(): boolean;
    get manageHref(): string;
    get labelsHref(): string;
    get adminHref(): string;
    get labelsText(): string;
    get disconnectedText(): string;
    get reconnectText(): string;
    get removeText(): string;
    get openText(): string;
    /** Signing out of every account of this browser when there are several (« Se déconnecter de tous les comptes »). */
    get signOutText(): string;
    /** Escape: raises `CloseRequested` (the host closes and gives the focus back to its button). */
    escape(): void;
    account_menu_load(_sender: ElementHandle): void;
    close_button_click(_sender: IconButton): void;
    camera_button_click(_sender: IconButton): void;
    manage_click(_sender: ElementHandle): void;
    toggle_click(_sender: ElementHandle): void;
    private rowId;
    account_click(_sender: ElementHandle, e: MouseEventArgs): void;
    reconnect_click(_sender: ElementHandle, e: MouseEventArgs): void;
    open_remote_click(_sender: ElementHandle, e: MouseEventArgs): void;
    remove_click(_sender: ElementHandle, e: MouseEventArgs): void;
    add_account_click(_sender: ElementHandle): void;
    labels_click(_sender: ElementHandle): void;
    admin_click(_sender: ElementHandle): void;
    sign_out_click(_sender: ElementHandle): void;
}
declare const _default: import("react").ComponentType<Readonly<AccountMenuProps>>;
export default _default;
