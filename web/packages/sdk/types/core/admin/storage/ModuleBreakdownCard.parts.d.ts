import type { ModuleBreakdownCard } from './ModuleBreakdownCard';
export declare function Part1({ isOpen, setOpen, m, identity }: {
    isOpen: NonNullable<ModuleBreakdownCard['rows_declaring']>[number]['isOpen'];
    setOpen: NonNullable<ModuleBreakdownCard['setOpen']>;
    m: NonNullable<ModuleBreakdownCard['rows_declaring']>[number]['m'];
    identity: NonNullable<ModuleBreakdownCard['rows_declaring']>[number]['identity'];
}): import("react").JSX.Element;
export declare function Part2({ t, data }: {
    t: NonNullable<ModuleBreakdownCard['tr']>;
    data: NonNullable<ModuleBreakdownCard['props']['data']>;
}): import("react").JSX.Element;
export declare function Part3({ t, data }: {
    t: NonNullable<ModuleBreakdownCard['tr']>;
    data: NonNullable<ModuleBreakdownCard['props']['data']>;
}): import("react").JSX.Element;
export declare function Part4({ t, data }: {
    t: NonNullable<ModuleBreakdownCard['tr']>;
    data: NonNullable<ModuleBreakdownCard['props']['data']>;
}): import("react").JSX.Element;
