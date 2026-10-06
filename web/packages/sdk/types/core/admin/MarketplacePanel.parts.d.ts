import type { MarketplacePanel } from './MarketplacePanel';
export declare function Part1({ visible, cat, busy, t, uninstall, install, phase }: {
    visible: NonNullable<MarketplacePanel['visible']>;
    cat: NonNullable<MarketplacePanel['rows_categories']>[number]['cat'];
    busy: MarketplacePanel['busy'];
    t: NonNullable<MarketplacePanel['tr']>;
    uninstall: NonNullable<MarketplacePanel['uninstall']>;
    install: NonNullable<MarketplacePanel['install']>;
    phase: NonNullable<MarketplacePanel['phase']>;
}): import("react").JSX.Element;
