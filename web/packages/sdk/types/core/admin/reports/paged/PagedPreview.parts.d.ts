import type { PagedPreview } from './PagedPreview';
export declare function Part1({ geos, firstOrientation }: {
    geos: NonNullable<PagedPreview['geos']>;
    firstOrientation: NonNullable<PagedPreview['firstOrientation']>;
}): import("react").JSX.Element;
export declare function Part2({ measureRef, items }: {
    measureRef: NonNullable<PagedPreview['measureRef']>;
    items: NonNullable<PagedPreview['props']['items']>;
}): import("react").JSX.Element;
export declare function Part3({ footerRef, footer }: {
    footerRef: NonNullable<PagedPreview['footerRef']>;
    footer: NonNullable<PagedPreview['props']['footer']>;
}): import("react").JSX.Element;
export declare function Part4({ frameRef, zoom, stackPx, stampVars, cover, orientation, setMenuSheet, menu, sheetRefs, styleOf, geos, sheets, orientOf, setFlips, t, sheetContent }: {
    frameRef: NonNullable<PagedPreview['frameRef']>;
    zoom: NonNullable<PagedPreview['zoom']>;
    stackPx: NonNullable<PagedPreview['stackPx']>;
    stampVars: NonNullable<PagedPreview['stampVars']>;
    cover: PagedPreview['props']['cover'];
    orientation: NonNullable<PagedPreview['props']['orientation']>;
    setMenuSheet: NonNullable<PagedPreview['setMenuSheet']>;
    menu: NonNullable<PagedPreview['menu']>;
    sheetRefs: NonNullable<PagedPreview['sheetRefs']>;
    styleOf: PagedPreview['styleOf'];
    geos: NonNullable<PagedPreview['geos']>;
    sheets: NonNullable<PagedPreview['sheets']>;
    orientOf: NonNullable<PagedPreview['orientOf']>;
    setFlips: NonNullable<PagedPreview['setFlips']>;
    t: NonNullable<PagedPreview['tr']>;
    sheetContent: PagedPreview['sheetContent'];
}): import("react").JSX.Element;
export declare function Part5({ stampVars, bandHeight, t, cover, thumb, geos, orientation, sheets, orientOf, sheetContent }: {
    stampVars: NonNullable<PagedPreview['stampVars']>;
    bandHeight: NonNullable<PagedPreview['bandHeight']>;
    t: NonNullable<PagedPreview['tr']>;
    cover: PagedPreview['props']['cover'];
    thumb: PagedPreview['thumb'];
    geos: NonNullable<PagedPreview['geos']>;
    orientation: NonNullable<PagedPreview['props']['orientation']>;
    sheets: NonNullable<PagedPreview['sheets']>;
    orientOf: NonNullable<PagedPreview['orientOf']>;
    sheetContent: PagedPreview['sheetContent'];
}): import("react").JSX.Element;
export declare function Part6({ menuItems, menu_pos, menu }: {
    menuItems: NonNullable<PagedPreview['menuItems']>;
    menu_pos: NonNullable<NonNullable<PagedPreview['menu']>['pos']>;
    menu: NonNullable<PagedPreview['menu']>;
}): import("react").JSX.Element;
export declare function Part7({ active, total, setActive, goTo, t }: {
    active: NonNullable<PagedPreview['active']>;
    total: NonNullable<PagedPreview['total']>;
    setActive: NonNullable<PagedPreview['setActive']>;
    goTo: PagedPreview['goTo'];
    t: NonNullable<PagedPreview['tr']>;
}): import("react").JSX.Element;
