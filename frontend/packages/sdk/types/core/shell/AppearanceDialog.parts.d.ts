import type { AppearanceDialog } from './AppearanceDialog';
declare function ModeMock({ variant }: {
    variant: 'light' | 'dark' | 'system';
}): import("react").JSX.Element;
export { ModeMock };
export declare function Part1({ current, setPref, moduleId, schemeOptions }: {
    current: NonNullable<AppearanceDialog['current']>;
    setPref: NonNullable<AppearanceDialog['setPref']>;
    moduleId: NonNullable<AppearanceDialog['props']['moduleId']>;
    schemeOptions: NonNullable<AppearanceDialog['schemeOptions']>;
}): import("react").JSX.Element;
export declare function Part2({ current, setPref, moduleId, densityOptions }: {
    current: NonNullable<AppearanceDialog['current']>;
    setPref: NonNullable<AppearanceDialog['setPref']>;
    moduleId: NonNullable<AppearanceDialog['props']['moduleId']>;
    densityOptions: NonNullable<AppearanceDialog['densityOptions']>;
}): import("react").JSX.Element;
