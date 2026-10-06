import type { InstanceCard } from './InstanceCard';
export declare function Part1({ t, instance }: {
    t: NonNullable<InstanceCard['tr']>;
    instance: NonNullable<InstanceCard['props']['instance']>;
}): import("react").JSX.Element;
export declare function Part2({ t, instance }: {
    t: NonNullable<InstanceCard['tr']>;
    instance: NonNullable<InstanceCard['props']['instance']>;
}): import("react").JSX.Element;
export declare function Part3({ t, instance, i18n }: {
    t: NonNullable<InstanceCard['tr']>;
    instance: NonNullable<InstanceCard['props']['instance']>;
    i18n: NonNullable<InstanceCard['i18n']>;
}): import("react").JSX.Element;
export declare function Part4({ t, accounts }: {
    t: NonNullable<InstanceCard['tr']>;
    accounts: NonNullable<InstanceCard['props']['accounts']>;
}): import("react").JSX.Element;
export declare function Part5({ t, instance, canCopy, copied, copy }: {
    t: NonNullable<InstanceCard['tr']>;
    instance: NonNullable<InstanceCard['props']['instance']>;
    canCopy: NonNullable<InstanceCard['canCopy']>;
    copied: NonNullable<InstanceCard['copied']>;
    copy: InstanceCard['copy'];
}): import("react").JSX.Element;
