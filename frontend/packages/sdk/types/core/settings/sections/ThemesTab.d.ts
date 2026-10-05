/**
 * Code-behind of `ThemesTab.kbview` (converted from `ThemesTab.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './ThemesTab.kbview';
import * as __parts from './ThemesTab.parts';
export declare class ThemesTab extends ViewBase {
    tr: ThemesTabStores['t'];
    user: ThemesTabStores['user'];
    updateUser: ThemesTabStores['updateUser'];
    themes: ThemesTabStores['themes'];
    activeThemeId: ThemesTabStores['activeThemeId'];
    applyTheme: ThemesTabStores['applyTheme'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        user: import("../../types").User | null;
        updateUser: (updates: Partial<import("../../types").User>) => void;
        themes: import("../../store/themeStore").ThemeDef[];
        activeThemeId: string;
        applyTheme: (id: string) => void;
        fetchThemes: () => Promise<void>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_themes(): boolean;
    get show_not_themes(): boolean;
    /** `<ThemePreview>`, rendered by a ReactHost. */
    get ThemePreview(): typeof __parts.ThemePreview;
    /** The rows of the Repeater over `themes`. */
    get rows_themes(): {
        theme: import("../../store/themeStore").ThemeDef;
        isActive: boolean;
        button_class: string | undefined;
        theme_preview_props: {
            theme: import("../../store/themeStore").ThemeDef;
        } | undefined;
        span_text: string | undefined;
        key: string;
    }[];
    select(id: string): Promise<void>;
    panel_click(_sender: unknown, args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ThemesTabStores = ReturnType<ThemesTab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
