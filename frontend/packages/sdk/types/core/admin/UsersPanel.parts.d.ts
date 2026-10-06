import type { UsersPanel } from './UsersPanel';
declare function CreateUserModal({ onClose }: {
    onClose: () => void;
}): import("react").JSX.Element;
export { CreateUserModal };
declare function RegistrationToggle(): import("react").JSX.Element;
export { RegistrationToggle };
export declare function Part1({ canBulk, allOnPage, togglePage, t, can, data, openUser, selected, toggleOne, unitName, ROLE_COLORS, toggleActive }: {
    canBulk: NonNullable<UsersPanel['canBulk']>;
    allOnPage: NonNullable<UsersPanel['allOnPage']>;
    togglePage: UsersPanel['togglePage'];
    t: NonNullable<UsersPanel['tr']>;
    can: NonNullable<UsersPanel['can']>;
    data: UsersPanel['data'];
    openUser: UsersPanel['openUser'];
    selected: NonNullable<UsersPanel['selected']>;
    toggleOne: UsersPanel['toggleOne'];
    unitName: UsersPanel['unitName'];
    ROLE_COLORS: NonNullable<UsersPanel['ROLE_COLORS']>;
    toggleActive: NonNullable<UsersPanel['toggleActive']>;
}): import("react").JSX.Element;
