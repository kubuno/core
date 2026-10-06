/**
 * The parts of `ThemesPanel.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { type ThemeDef } from "../store/themeStore";
import type { ThemesPanel } from './ThemesPanel';
declare function ThemeChip({ theme }: {
    theme: ThemeDef;
}): import("react").JSX.Element;
export { ThemeChip };
export declare function Part1({ fileInputRef, handleFileChange }: {
    fileInputRef: NonNullable<ThemesPanel['fileInputRef']>;
    handleFileChange: ThemesPanel['handleFileChange'];
}): import("react").JSX.Element;
export declare function Part2({ zipInputRef, handleZipChange }: {
    zipInputRef: NonNullable<ThemesPanel['zipInputRef']>;
    handleZipChange: ThemesPanel['handleZipChange'];
}): import("react").JSX.Element;
export declare function Part3(): import("react").JSX.Element;
