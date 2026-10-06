import type { ModuleAdminSettings } from './ModuleAdminSettings';
export declare function Part1({ tabs, activeTab, setTab, t }: {
    tabs: NonNullable<ModuleAdminSettings['tabs']>;
    activeTab: NonNullable<ModuleAdminSettings['activeTab']>;
    setTab: NonNullable<ModuleAdminSettings['setTab']>;
    t: NonNullable<ModuleAdminSettings['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ ExtraTab }: {
    ExtraTab: NonNullable<ModuleAdminSettings['ExtraTab']>;
}): import("react").JSX.Element;
export declare function Part3({ pageCategories, categorySection }: {
    pageCategories: NonNullable<ModuleAdminSettings['pageCategories']>;
    categorySection: ModuleAdminSettings['categorySection'];
}): import("react").JSX.Element;
