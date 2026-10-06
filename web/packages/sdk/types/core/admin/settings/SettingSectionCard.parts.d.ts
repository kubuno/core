import type { SettingSectionCard } from './SettingSectionCard';
export declare function Part1({ onToggle, open, bodyId, icon, title, description, status }: {
    onToggle: NonNullable<SettingSectionCard['props']['onToggle']>;
    open: NonNullable<SettingSectionCard['props']['open']>;
    bodyId: NonNullable<SettingSectionCard['bodyId']>;
    icon: NonNullable<SettingSectionCard['props']['icon']>;
    title: SettingSectionCard['props']['title'];
    description: NonNullable<SettingSectionCard['props']['description']>;
    status: NonNullable<SettingSectionCard['props']['status']>;
}): import("react").JSX.Element;
export declare function Part2({ bodyId, aside, children, footer }: {
    bodyId: NonNullable<SettingSectionCard['bodyId']>;
    aside: NonNullable<SettingSectionCard['props']['aside']>;
    children: SettingSectionCard['props']['children'];
    footer: SettingSectionCard['props']['footer'];
}): import("react").JSX.Element;
