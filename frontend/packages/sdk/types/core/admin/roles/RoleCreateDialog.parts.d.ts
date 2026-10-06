import type { RoleCreateDialog } from './RoleCreateDialog';
export declare function Part1({ t, name, setName, slugTouched, setSlug }: {
    t: NonNullable<RoleCreateDialog['tr']>;
    name: NonNullable<RoleCreateDialog['name']>;
    setName: NonNullable<RoleCreateDialog['setName']>;
    slugTouched: NonNullable<RoleCreateDialog['slugTouched']>;
    setSlug: NonNullable<RoleCreateDialog['setSlug']>;
}): import("react").JSX.Element;
export declare function Part2({ t, description, setDescription }: {
    t: NonNullable<RoleCreateDialog['tr']>;
    description: NonNullable<RoleCreateDialog['description']>;
    setDescription: NonNullable<RoleCreateDialog['setDescription']>;
}): import("react").JSX.Element;
export declare function Part3({ t }: {
    t: NonNullable<RoleCreateDialog['tr']>;
}): import("react").JSX.Element;
