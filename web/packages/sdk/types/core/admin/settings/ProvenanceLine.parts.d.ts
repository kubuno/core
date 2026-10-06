import type { ProvenanceLine } from './ProvenanceLine';
export declare function Part1({ items, menu_pos, menu, theme }: {
    items: NonNullable<ProvenanceLine['items']>;
    menu_pos: NonNullable<NonNullable<ProvenanceLine['menu']>['pos']>;
    menu: NonNullable<ProvenanceLine['menu']>;
    theme: NonNullable<ProvenanceLine['theme']>;
}): import("react").JSX.Element;
