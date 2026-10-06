import type { AboutPage } from './AboutPage';
declare function GithubMark({ size, className }: {
    size?: number;
    className?: string;
}): import("react").JSX.Element;
export { GithubMark };
export declare function Part1(): import("react").JSX.Element;
export declare function Part2({ t, modulesCount }: {
    t: NonNullable<AboutPage['tr']>;
    modulesCount: NonNullable<AboutPage['modulesCount']>;
}): import("react").JSX.Element;
export declare function Part3(): import("react").JSX.Element;
