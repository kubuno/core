import type { HeaderActions } from './HeaderActions';
export declare function Part1({ btn, t, ico, unreadCount, markAllRead, notifications, markRead, navigate }: {
    btn: NonNullable<HeaderActions['btn']>;
    t: NonNullable<HeaderActions['tr']>;
    ico: NonNullable<HeaderActions['ico']>;
    unreadCount: NonNullable<HeaderActions['unreadCount']>;
    markAllRead: NonNullable<HeaderActions['markAllRead']>;
    notifications: NonNullable<HeaderActions['notifications']>;
    markRead: NonNullable<HeaderActions['markRead']>;
    navigate: NonNullable<HeaderActions['navigate']>;
}): import("react").JSX.Element;
export declare function Part2({ SettingsButtonOverride, compact, dark }: {
    SettingsButtonOverride: NonNullable<HeaderActions['SettingsButtonOverride']>;
    compact: NonNullable<HeaderActions['compact']>;
    dark: NonNullable<HeaderActions['dark']>;
}): import("react").JSX.Element;
export declare function Part3({ btn, ico, t }: {
    btn: NonNullable<HeaderActions['btn']>;
    ico: NonNullable<HeaderActions['ico']>;
    t: NonNullable<HeaderActions['tr']>;
}): import("react").JSX.Element;
