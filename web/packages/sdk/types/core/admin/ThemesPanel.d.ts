/**
 * Code-behind of `ThemesPanel.kbview` (converted from `ThemesPanel.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { type ThemeDef } from "../store/themeStore";
import { ViewBase } from './ThemesPanel.kbview';
import * as __parts from './ThemesPanel.parts';
export declare class ThemesPanel extends ViewBase {
    accessor importError: string | null;
    accessor deleteConfirmId: string | null;
    accessor selectedId: string | null;
    tr: ThemesPanelStores['t'];
    themes: ThemeDef[];
    activeThemeId: string;
    applyTheme: (id: string) => void;
    fetchThemes: () => Promise<void>;
    loadThemePreview: (theme: ThemeDef) => void;
    clearThemePreview: () => void;
    fileInputRef: ThemesPanelStores['fileInputRef'];
    zipInputRef: ThemesPanelStores['zipInputRef'];
    saveMut: ThemesPanelStores['saveMut'];
    importMut: ThemesPanelHooks['importMut'];
    importZipMut: ThemesPanelHooks['importZipMut'];
    trustMut: ThemesPanelStores['trustMut'];
    deleteMut: ThemesPanelHooks['deleteMut'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        themes: ThemeDef[];
        activeThemeId: string;
        applyTheme: (id: string) => void;
        fetchThemes: () => Promise<void>;
        loadThemePreview: (theme: ThemeDef) => void;
        clearThemePreview: () => void;
        qc: import("@tanstack/query-core").QueryClient;
        fileInputRef: import("react").RefObject<HTMLInputElement | null>;
        zipInputRef: import("react").RefObject<HTMLInputElement | null>;
        saveMut: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string, unknown>;
        trustMut: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, {
            id: string;
            enabled: boolean;
        }, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        importMut: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, unknown, ThemeDef, unknown>;
        importZipMut: import("@tanstack/react-query").UseMutationResult<{
            data?: {
                theme?: {
                    id?: string;
                };
            };
        }, unknown, File, unknown>;
        deleteMut: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, string, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get selected(): ThemeDef;
    get isActive(): boolean;
    get isBuiltin(): boolean;
    get enabled_unless_import_mut_is_pending(): boolean;
    get enabled_unless_import_zip_mut_is_pending(): boolean;
    get part1_props(): {
        fileInputRef: import("react").RefObject<HTMLInputElement | null>;
        handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    };
    /** A part of the screen still written in React (<input> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        zipInputRef: import("react").RefObject<HTMLInputElement | null>;
        handleZipChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    };
    /** A part of the screen still written in React (<input> has no .kbview element yet). */
    get Part2(): typeof __parts.Part2;
    get show_import_error(): boolean;
    get show_import_mut_is_pending_import_zip_mut(): boolean;
    get show_themes(): boolean;
    /** `<ThemeChip>`, rendered by a ReactHost. */
    get ThemeChip(): typeof __parts.ThemeChip;
    /** The rows of the Repeater over `themes`. */
    get rows_themes(): {
        theme: ThemeDef;
        sel: boolean;
        active: boolean;
        button_class: string;
        theme_chip_props: {
            theme: ThemeDef;
        };
        span_text: string;
        show_theme_builtin: boolean;
        show_theme_has_scripts: boolean;
        key: string;
    }[];
    get show_selected(): boolean;
    get show_not_selected(): boolean;
    get show_is_builtin(): boolean;
    get show_delete_confirm_id_selected_id(): boolean;
    get show_not_delete_confirm_id_selected_id(): boolean;
    get visible(): boolean;
    get visible2(): boolean;
    get enabled_unless_is_active(): boolean;
    get button_text(): string;
    get show_selected_has_scripts(): boolean;
    get on(): boolean;
    get enabled_unless_trust_mut_is_pending(): boolean;
    get text(): string;
    /** `<ThemeDevicePreview>`, rendered by a ReactHost. */
    get ThemeDevicePreview(): import("react").FunctionComponent<Readonly<import("./ThemeDevicePreview").ThemeDevicePreviewProps>>;
    get theme_device_preview_props(): {
        theme: ThemeDef;
    };
    get visible3(): boolean;
    /** A part of the screen still written in React (<pre> has no .kbview element yet). */
    get Part3(): typeof __parts.Part3;
    handleApply(theme: ThemeDef): void;
    handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void;
    handleZipChange(e: React.ChangeEvent<HTMLInputElement>): void;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
    button_click2(_sender: unknown, _args: MouseEventArgs): void;
    panel_click(_sender: unknown, args: MouseEventArgs): void;
    button_click3(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click4(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click5(_sender: unknown, _args: MouseEventArgs): undefined;
    button_click6(_sender: unknown, _args: MouseEventArgs): undefined;
    switch_checked_changed(_sender: unknown, args: EventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ThemesPanelStores = ReturnType<ThemesPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ThemesPanelHooks = ReturnType<ThemesPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
