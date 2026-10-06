import '../../index.css';
import i18n from '../../core/i18n';
import '../../core/viewsHost';
export { i18n };
/** The languages the designer's toolbar offers. */
export declare const DESIGN_LANGUAGES: readonly ["fr", "en", "ar"];
export declare const RTL_LANGUAGES: Set<string>;
export type KubunoThemeMode = 'light' | 'dark';
/** The Kubuno theme of each mode (the core's built-in themes). */
export declare const THEME_IDS: Readonly<Record<KubunoThemeMode, string>>;
/**
 * Applies the Kubuno theme of `mode` with the core's theme store. Returns false when the theme files are not
 * available (the page keeps the default tokens of `theme.css`, which are the reference theme's).
 */
export declare function applyKubunoTheme(base: string, mode: KubunoThemeMode): Promise<boolean>;
