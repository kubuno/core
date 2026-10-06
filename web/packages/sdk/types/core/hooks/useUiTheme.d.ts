import type { MenuTheme } from '@ui';
/**
 * Light or dark, for the `@ui` surfaces that paint themselves in JavaScript
 * (`MenuDropdown` and friends) instead of through theme variables.
 *
 * Those components default to `light`, so a menu opened on a dark theme comes
 * out white-on-white unless the caller says otherwise — this hook is that
 * answer, in one place rather than re-derived at every call site.
 */
export declare function useUiTheme(): MenuTheme;
