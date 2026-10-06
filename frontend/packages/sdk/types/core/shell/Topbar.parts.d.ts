import type { Topbar } from './Topbar';
export declare function Part1(): import("react").JSX.Element;
export declare function Part2({ SettingsButtonOverride }: {
    SettingsButtonOverride: NonNullable<Topbar['SettingsButtonOverride']>;
}): import("react").JSX.Element;
export declare function Part3(): import("react").JSX.Element;
export declare function Part4({ user, user_avatar_url, initials, accounts, remove, setAddModalOpen, handleLogout }: {
    user: Topbar['user'];
    user_avatar_url: string;
    initials: NonNullable<Topbar['initials']>;
    accounts: NonNullable<Topbar['accounts']>;
    remove: NonNullable<Topbar['remove']>;
    setAddModalOpen: NonNullable<Topbar['setAddModalOpen']>;
    handleLogout: Topbar['handleLogout'];
}): import("react").JSX.Element;
