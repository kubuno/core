import type { ArchiveOptions } from './ArchiveOptions';
export declare function Part1({ t }: {
    t: NonNullable<ArchiveOptions['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ maxFileMb, onMaxFileMb, options, t }: {
    maxFileMb: NonNullable<ArchiveOptions['props']['maxFileMb']>;
    onMaxFileMb: NonNullable<ArchiveOptions['props']['onMaxFileMb']>;
    options: NonNullable<ArchiveOptions['options']>;
    t: NonNullable<ArchiveOptions['tr']>;
}): import("react").JSX.Element;
