/**
 * The brand in the top-left corner: the logo and name of the app the reader is
 * in, linking to that app's entry point. Inside Mail it reads "Mail" and opens
 * the inbox; inside Office's Documents it reads "Documents" and opens the
 * documents hub. Outside every module (home, administration, settings) it is
 * the instance logo and "Kubuno", linking to the home page.
 *
 * Resolution follows the same rule as the tab title and favicon: the app whose
 * route prefix is the longest match for the current path, so a sub-module wins
 * over its parent. The link opens the app's `landing` when it declares one
 * (Drive's "Accueil"), otherwise its route root.
 */
export declare function BrandLink({ collapsed, iconSize, className }: {
    collapsed?: boolean;
    /** Logo edge in px: 32 in the top bar, 40 in the sidebar corner. */
    iconSize?: number;
    className?: string;
}): import("react").JSX.Element;
